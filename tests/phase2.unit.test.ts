import { describe, expect, it } from 'vitest';
import { emptyCatalog, readCatalog, safeMedia, localized } from '../src/content';
import { routeFromHash } from '../src/router';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error The server-only sync is plain ESM and never bundled into the website.
import { parseDocument, published, rows, safeImageUrl, selectTab, sync } from '../scripts/google-sync.mjs';
describe('static content and navigation',()=>{
  it('accepts honest empty content and rejects remote media',()=>{expect(readCatalog(emptyCatalog)).toEqual(emptyCatalog);expect(safeMedia('https://drive.google.com/private')).toBe(false);expect(safeMedia('content/media/../secret.png')).toBe(false);expect(safeMedia('content/media/abc.webp')).toBe(true);expect(()=>readCatalog({...emptyCatalog,relationship:{src:'javascript:alert(1)',alt:{'zh-TW':'x'}}})).toThrow();});
  it('preserves legacy anchors and direct hash subpages',()=>{expect(routeFromHash('#connect')).toBe('');expect(routeFromHash('#/archive/chapter-1')).toBe('archive/chapter-1');expect(routeFromHash('#/shop/')).toBe('shop');});
  it('falls back honestly to original text',()=>{expect(localized({'zh-TW':'原文'},'en')).toBe('原文');});
});
describe('Google publication security and document ordering',()=>{
  it('never publishes drafts or future releases',()=>{expect(published({publishStatus:'draft'})).toBe(false);expect(published({publishStatus:'published',date:'2099-01-01'})).toBe(false);expect(published({publishStatus:'published',date:'2020-01-01'})).toBe(true);});
  it('maps sheet headers without including empty rows',()=>{expect(rows([['id','publishStatus'],['story','draft'],[]])).toEqual([{id:'story',publishStatus:'draft'}]);expect(()=>rows([['id','id']])).toThrow();});
  it('preserves text-image-text order and bold/italic without HTML interpretation',async()=>{
    const document={body:{content:[{paragraph:{elements:[{textRun:{content:'<script>safe text</script>',textStyle:{bold:true,italic:true}}},{inlineObjectElement:{inlineObjectId:'image'}},{textRun:{content:'after'}}]}}]},inlineObjects:{image:{inlineObjectProperties:{embeddedObject:{title:'Caption',description:'Alt text',imageProperties:{contentUri:'https://lh3.googleusercontent.com/image'}}}}}};
    const blocks=await parseDocument(document,undefined,async()=>({src:'content/media/abc.webp',width:10,height:20}));expect(blocks.map((b:{type:string})=>b.type)).toEqual(['paragraph','image','paragraph']);expect(blocks[0].runs[0]).toEqual({text:'<script>safe text</script>',bold:true,italic:true});expect(blocks[1].caption).toBe('Caption');
  });
  it('requires explicit multi-tab selection to avoid publishing unrelated drafts',()=>{const document={tabs:[{tabProperties:{tabId:'one'},documentTab:{body:{}}},{tabProperties:{tabId:'two'},documentTab:{body:{}}}]};expect(()=>selectTab(document)).toThrow();expect(selectTab(document,'two')).toEqual({body:{}});});
  it('rejects unsupported structures instead of silently dropping images',async()=>{await expect(parseDocument({body:{content:[{table:{}}]}},undefined,()=>{})).rejects.toThrow();await expect(parseDocument({body:{content:[{paragraph:{positionedObjectIds:['x'],elements:[]}}]}},undefined,()=>{})).rejects.toThrow();});
  it('blocks untrusted image hosts and token exfiltration destinations',()=>{for(const u of ['http://lh3.googleusercontent.com/x','https://googleusercontent.com.evil.example/x','https://evil.example/x','https://user:pass@lh3.googleusercontent.com/x'])expect(()=>safeImageUrl(u)).toThrow();expect(safeImageUrl('https://lh3.googleusercontent.com/x')).toContain('https://');});
  it('does not authenticate or fetch anything before opt-in',async()=>{let called=false;expect(await sync({env:{},request:()=>{called=true;}})).toEqual({status:'disabled'});expect(called).toBe(false);});
  it('preserves the previous catalog when a Google API fails',async()=>{
    const output=await mkdtemp(join(tmpdir(),'longday-sync-test-'));
    const previous=JSON.stringify(emptyCatalog);await writeFile(join(output,'catalog.json'),previous);
    const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
    const credentials={client_email:'test@example.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})};
    const request=async(url:string)=>url.includes('oauth2.googleapis.com')?new Response(JSON.stringify({access_token:'fixture-token'}),{status:200}):new Response('',{status:503});
    try{await expect(sync({env:{GOOGLE_SYNC_ENABLED:'true',GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify(credentials),GOOGLE_PUBLICATION_SHEET_ID:'fixture-sheet-id'},request,output})).rejects.toThrow('503');expect(await readFile(join(output,'catalog.json'),'utf8')).toBe(previous);}finally{await rm(output,{recursive:true,force:true});}
  });
});
