/** Server-only publication pipeline. No credentials or source IDs reach the generated catalog. */
import { createHash, createSign } from 'node:crypto';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { readCatalog } from '../src/content.ts';

const MAX_BYTES = 20 * 1024 * 1024;
const scopes = ['documents.readonly','drive.readonly','spreadsheets.readonly'].map(s=>`https://www.googleapis.com/auth/${s}`).join(' ');
const fail = (message) => { throw new Error(message); };
const validId = value => /^[\w-]{10,200}$/.test(value || '') ? value : fail('Invalid Google identifier in publication configuration');
const localized = (value, english = '') => ({ 'zh-TW': String(value || ''), ...(english ? { en: String(english) } : {}) });
export function rows(values = []) {
  if (!values.length) return [];
  const [headers,...data] = values;
  if (new Set(headers).size !== headers.length) fail('Duplicate Sheet column');
  return data.filter(r=>r.some(v=>String(v).trim())).map(row=>Object.fromEntries(headers.map((key,i)=>[key,String(row[i] ?? '').trim()])));
}
export function published(row, today = new Date().toISOString().slice(0,10)) { return row.publishStatus === 'published' && (!row.date || row.date <= today); }
export function selectTab(document, tabId) {
  const flatten = tabs => tabs.flatMap(t=>[t,...flatten(t.childTabs || [])]);
  const tabs = flatten(document.tabs || []);
  if (!tabs.length) return document;
  if (!tabId && tabs.length !== 1) fail('Multiple document tabs: choose the published tabId explicitly');
  const tab = tabId ? tabs.find(t=>t.tabProperties?.tabId === tabId) : tabs[0];
  if (!tab?.documentTab) fail('Published document tab not found');
  return tab.documentTab;
}
/** Keep paragraph elements and inline illustrations in exact source order; unsupported shapes fail closed. */
export async function parseDocument(document, tabId, downloadImage) {
  const tab = selectTab(document, tabId);
  const blocks = [];
  for (const entry of tab.body?.content || []) {
    if (entry.sectionBreak) continue;
    if (!entry.paragraph) fail('Unsupported document structure: use paragraphs, headings and inline images, not tables');
    const paragraph = entry.paragraph;
    if (paragraph.positionedObjectIds?.length) fail('Floating images must be changed to inline before publication');
    const style = paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
    let runs = [];
    const flush = () => { const text = runs.map(r=>r.text).join(''); if (text.trim()) blocks.push(text.trim() === '---' ? {type:'divider'} : {type:/HEADING_|TITLE/.test(style)?'heading':'paragraph', ...(/HEADING_|TITLE/.test(style)?{level:style==='HEADING_3'?3:2}:{}),runs}); runs=[]; };
    for (const element of paragraph.elements || []) {
      if (element.textRun) { const r=element.textRun; runs.push({text:r.content || '',...(r.textStyle?.bold?{bold:true}:{}),...(r.textStyle?.italic?{italic:true}:{})}); }
      else if (element.inlineObjectElement) { flush(); const object=tab.inlineObjects?.[element.inlineObjectElement.inlineObjectId]?.inlineObjectProperties?.embeddedObject; const uri=object?.imageProperties?.contentUri; if(!uri)fail('Unsupported embedded object; use an inline image'); const image=await downloadImage(uri); blocks.push({type:'image',...image,alt:object.description||object.title||'Illustration',...(object.title?{caption:object.title}:{})}); }
      else if (element.horizontalRule || element.pageBreak) { flush();blocks.push({type:'divider'}); }
      else fail('Unsupported paragraph element; publication stopped without replacing the live site');
    }
    flush();
  }
  if (!blocks.length) fail('Refusing to publish an empty document');
  return blocks;
}
export function safeImageUrl(value) { const url=new URL(value); if(url.protocol!=='https:' || url.username || url.password || !(url.hostname.endsWith('.googleusercontent.com') || url.hostname==='googleusercontent.com'))fail('Image download host is not approved');return url.href; }
async function limitedBody(response) {
  if(Number(response.headers.get('content-length'))>MAX_BYTES)fail('Image exceeds 20 MB');
  const chunks=[];let length=0;for await(const chunk of response.body){length+=chunk.length;if(length>MAX_BYTES)fail('Image exceeds 20 MB');chunks.push(chunk);}return Buffer.concat(chunks);
}
async function accessToken(credentials, request) {
  if(!credentials.client_email?.endsWith('.iam.gserviceaccount.com') || !credentials.private_key)fail('Missing service-account credentials');
  const now=Math.floor(Date.now()/1000), encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned=`${encode({alg:'RS256',typ:'JWT'})}.${encode({iss:credentials.client_email,scope:scopes,aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})}`;
  const signature=createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key,'base64url');
  const response=await request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)fail(`Google authentication failed (HTTP ${response.status}); secret values are withheld`);
  const result=await response.json();if(typeof result.access_token!=='string')fail('Google token response is invalid');return result.access_token;
}
export async function sync({ env=process.env, request=fetch, output=resolve('public/content') }={}) {
  if(env.GOOGLE_SYNC_ENABLED!=='true')return {status:'disabled'};
  const credentials=JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  const token=await accessToken(credentials,request);
  const get=async url=>{const response=await request(url,{headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)fail(`Google API request failed (HTTP ${response.status}); source details withheld`);return response;};
  const sheet=validId(env.GOOGLE_PUBLICATION_SHEET_ID);
  const values=await (await get(`https://sheets.googleapis.com/v4/spreadsheets/${sheet}/values:batchGet?ranges=Articles!A1:Q1001&ranges=Products!A1:O201`)).json();
  if(values.valueRanges?.length!==2)fail('Both Articles and Products sheets are required');
  const articles=rows(values.valueRanges[0].values),products=rows(values.valueRanges[1].values);
  const parent=resolve(output,'..');await mkdir(parent,{recursive:true});
  const stage=await mkdtemp(join(parent,'.sync-stage-'));await mkdir(join(stage,'media'));
  const saveImage=async bytes=>{const result=await sharp(bytes,{limitInputPixels:24_000_000,animated:false}).rotate().resize({width:2000,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:86}).toBuffer({resolveWithObject:true});const hash=createHash('sha256').update(result.data).digest('hex');await writeFile(join(stage,'media',`${hash}.webp`),result.data);return {src:`content/media/${hash}.webp`,width:result.info.width,height:result.info.height};};
  const fromUri=async uri=>{let url=safeImageUrl(uri);for(let i=0;i<4;i++){const response=await request(url,{redirect:'manual',signal:AbortSignal.timeout(30000)});if(response.status>=300&&response.status<400){url=safeImageUrl(new URL(response.headers.get('location'),url).href);continue;}if(!response.ok)fail(`Document illustration download failed (HTTP ${response.status})`);return saveImage(await limitedBody(response));}fail('Too many image redirects');};
  const fromDrive=async id=>saveImage(await limitedBody(await get(`https://www.googleapis.com/drive/v3/files/${validId(id)}?alt=media`)));
  try {
    const catalog={version:1,articles:[],products:[],relationship:null};
    for(const row of articles.filter(r=>published(r))){
      if(!row.date || !row.title || !['novel','diary'].includes(row.kind))fail('Published article requires date, title and kind');
      const document=await(await get(`https://docs.googleapis.com/v1/documents/${validId(row.docId)}?includeTabsContent=true&suggestionsViewMode=PREVIEW_WITHOUT_SUGGESTIONS`)).json();
      const blocks=await parseDocument(document,row.tabId,fromUri);
      catalog.articles.push({id:row.id,kind:row.kind,title:localized(row.title,row.titleEn),summary:localized(row.summary,row.summaryEn),date:row.date,...(row.series?{series:row.series,chapter:Number(row.chapter)||0}:{}),...(row.coverDriveId?{cover:(await fromDrive(row.coverDriveId)).src}:{}),blocks});
    }
    for(const row of products.filter(r=>published(r))){
      if(!row.name || !row.imageDriveId)fail('Published products require name and imageDriveId');
      const detailIds=(row.detailImageDriveIds||'').split(',').map(id=>id.trim()).filter(Boolean);
      if(detailIds.length>8)fail('A product supports up to eight detail images');
      const images=[];for(const id of detailIds)images.push((await fromDrive(id)).src);
      catalog.products.push({id:row.id,name:localized(row.name,row.nameEn),summary:localized(row.summary,row.summaryEn),description:localized(row.description,row.descriptionEn),status:localized(row.status,row.statusEn),order:Number(row.order)||0,...(row.price?{price:row.price}:{}),image:(await fromDrive(row.imageDriveId)).src,...(images.length?{images}:{})});
    }
    if(env.GOOGLE_RELATIONSHIP_FOLDER_ID){const folder=validId(env.GOOGLE_RELATIONSHIP_FOLDER_ID);const q=`'${folder}' in parents and trashed = false and name contains 'relationships-published.'`;const result=await(await get(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType),nextPageToken&pageSize=100`)).json();const files=(result.files||[]).filter(f=>/^relationships-published\.(png|jpe?g|webp)$/i.test(f.name));if(files.length!==1)fail('Relationship folder must contain exactly one relationships-published image');catalog.relationship={src:(await fromDrive(files[0].id)).src,alt:localized('角色關係網','Character relationships')};}
    readCatalog(catalog);
    if(!catalog.articles.length&&!catalog.products.length&&!catalog.relationship && env.GOOGLE_ALLOW_EMPTY_PUBLICATION!=='true')fail('Empty publication refused; explicit GOOGLE_ALLOW_EMPTY_PUBLICATION is required');
    await writeFile(join(stage,'catalog.json'),JSON.stringify(catalog));
    // The output is only replaced after every API request, image conversion and schema check succeeds.
    const backup=`${stage}-previous`;let backedUp=false;
    try{await rename(output,backup);backedUp=true;}catch(error){if(error.code!=='ENOENT')throw error;}
    try{await rename(stage,output);}catch(error){if(backedUp)await rename(backup,output);throw error;}
    if(backedUp)await rm(backup,{recursive:true,force:true});
    return {status:'published',articles:catalog.articles.length,products:catalog.products.length,relationship:!!catalog.relationship};
  }finally{await rm(stage,{recursive:true,force:true});}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){sync().then(result=>console.log(JSON.stringify(result))).catch(()=>{console.error('Google sync failed. Existing deployment is preserved. Check publication rows, inline-image format, API access and repository secrets. No private document content is logged.');process.exitCode=1;});}
