import { useContext, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import { asset, site, type Language } from '../config/site';
import { copy, localized, readCatalog, type Article, type Catalog, type Product, type TextRun } from '../content';
import { AnimatedText, AnimationContext } from '../components/AnimatedText';
import { Glass } from '../components/Glass';
import { Gallery } from '../components/Gallery';

type Props = { language: Language };
const label = (key: Parameters<typeof copy>[0], language: Language) => <AnimatedText>{copy(key, language)}</AnimatedText>;
function PageTitle({ title, intro, language }: Props & { title: 'archive' | 'shop' | 'relationships' | 'about'; intro: Parameters<typeof copy>[0] }) {
  return <header className="content-heading"><p className="eyebrow">LONGDAY / {title.toUpperCase()}</p><h1>{label(title, language)}<span aria-hidden="true">.</span></h1><p>{label(intro, language)}</p></header>;
}
function Empty({ title, detail }: { title: string; detail?: string }) { return <Glass className="empty-state"><span className="empty-mark" aria-hidden="true">✳</span><h2>{title}</h2>{detail && <p>{detail}</p>}</Glass>; }
function Media({ src, alt, className = '', onClick, retryable = true }: { src: string; alt: string; className?: string; onClick?: () => void; retryable?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = document.documentElement.lang === 'en' ? 'en' : 'zh-TW';
  if (failed) return <div className="image-fallback"><p>{copy('imageError', language)}</p>{retryable && <button className="button button-secondary" onClick={() => { setFailed(false); setAttempt(x => x + 1); }}>{copy('retry', language)}</button>}</div>;
  const image = <img key={`${src}-${attempt}`} className={`content-image ${className}`} src={asset(src)} alt={alt} loading="lazy" decoding="async" onLoad={e => e.currentTarget.classList.add('loaded')} onError={() => setFailed(true)} />;
  return onClick ? <button className="image-enlarge" onClick={onClick} aria-label={`${copy('zoomIn', language)}: ${alt}`}>{image}</button> : image;
}
function Lightbox({ src, alt, onClose, language }: Props & { src: string; alt: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = dialog.current!; const focus = document.activeElement as HTMLElement; d.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { d.close(); document.body.style.overflow = overflow; focus?.focus({ preventScroll: true }); }; }, []);
  return <dialog ref={dialog} className="art-dialog" aria-label={alt} onCancel={onClose}><button className="dialog-close button button-secondary" onClick={onClose}>{copy('close', language)}</button><Media src={src} alt={alt} /><p>{alt}</p></dialog>;
}
function Runs({ runs }: { runs: TextRun[] }) { return <>{runs.map((r, i) => <span key={i} style={{ fontWeight: r.bold ? 700 : undefined, fontStyle: r.italic ? 'italic' : undefined }}>{r.text}</span>)}</>; }
function Reader({ article, articles, language }: Props & { article: Article; articles: Article[] }) {
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const rect = body.current?.getBoundingClientRect(); if (rect) setProgress(Math.min(100, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight) * 100))); }); };
    update(); addEventListener('scroll', update, { passive: true }); addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update); removeEventListener('resize', update); };
  }, [article.id]);
  const chapters = article.series ? articles.filter(a => a.kind === article.kind && a.series === article.series).sort((a,b) => (a.chapter ?? 0) - (b.chapter ?? 0)) : [article];
  const index = chapters.findIndex(a => a.id === article.id);
  return <article className="reader">
    <a className="text-link" href="#/archive">← {copy('archive', language)}</a>
    <header className="reader-heading"><p className="eyebrow">{copy(article.kind, language)} / <time dateTime={article.date}>{article.date}</time></p><h1><AnimatedText>{localized(article.title, language)}</AnimatedText></h1><p>{localized(article.summary, language)}</p>{language === 'en' && <small>{copy('original', language)}</small>}</header>
    {article.cover && <Media src={article.cover} alt={localized(article.title, language)} className="reader-cover" />}
    <div className="reading-progress" role="progressbar" aria-label={copy('progress', language)} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
    <div className="reader-layout"><aside className="reader-toc"><h2>{copy('contents', language)}</h2>{chapters.map(a => <a key={a.id} href={`#/archive/${a.id}`} aria-current={a.id === article.id ? 'page' : undefined}>{localized(a.title, language)}</a>)}{article.blocks.map((b, i) => b.type === 'heading' && <button key={i} onClick={() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: document.documentElement.dataset.motion === 'still' ? 'instant' : 'smooth' })}>{b.runs.map(r => r.text).join('')}</button>)}</aside>
    <div ref={body} className="reader-body">{article.blocks.map((block, i) => {
      if (block.type === 'divider') return <hr key={i} />;
      if (block.type === 'image') return <figure key={i} style={{ '--image-ratio': `${block.width}/${block.height}` } as React.CSSProperties}><Media src={block.src} alt={block.alt} onClick={() => setZoom({ src: block.src, alt: block.alt })} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
      if (block.type === 'heading') return block.level === 3 ? <h3 key={i} id={`section-${i}`}><Runs runs={block.runs} /></h3> : <h2 key={i} id={`section-${i}`}><Runs runs={block.runs} /></h2>;
      return <p key={i}><Runs runs={block.runs} /></p>;
    })}<nav className="chapter-navigation" aria-label={copy('contents', language)}>{index > 0 && <a className="button button-secondary" href={`#/archive/${chapters[index - 1].id}`}>← {copy('previous', language)}</a>}{index < chapters.length - 1 && <a className="button button-secondary" href={`#/archive/${chapters[index + 1].id}`}>{copy('next', language)} →</a>}</nav></div></div>
    {zoom && <Lightbox {...zoom} language={language} onClose={() => setZoom(null)} />}
  </article>;
}
function Archive({ catalog, language, id }: Props & { catalog: Catalog; id?: string }) {
  const [kind, setKind] = useState<'novel' | 'diary'>('novel');
  if (id) { const article = catalog.articles.find(a => a.id === id); return article ? <Reader key={id} article={article} articles={catalog.articles} language={language} /> : <Empty title={copy('notFound', language)} />; }
  const articles = catalog.articles.filter(a => a.kind === kind).sort((a,b) => b.date.localeCompare(a.date));
  return <><PageTitle title="archive" intro="archiveIntro" language={language} /><div className="content-filters" role="group" aria-label={copy('archive', language)}>{(['novel','diary'] as const).map(k => <button key={k} className="button button-secondary" aria-pressed={kind === k} onClick={() => setKind(k)}>{label(k, language)}</button>)}</div>{articles.length ? <div className="archive-grid">{articles.map(a => <m.a key={a.id} className="archive-card glass" href={`#/archive/${a.id}`} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>{a.cover ? <Media src={a.cover} alt="" retryable={false} /> : <div className="cover-placeholder" aria-hidden="true">✳</div>}<div><time dateTime={a.date}>{a.date}</time><h2>{localized(a.title, language)}</h2><p>{localized(a.summary, language)}</p></div></m.a>)}</div> : <Empty title={copy('empty', language)} />}</>;
}
function Relationships({ catalog, language }: Props & { catalog: Catalog }) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number; distance: number } | null>(null);
  const snapshot = () => { const p = [...pointers.current.values()]; return p.length ? { x: p.reduce((v,p) => v+p.x,0)/p.length, y: p.reduce((v,p) => v+p.y,0)/p.length, distance: p.length > 1 ? Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y) : 0 } : null; };
  const move = (e: ReactPointerEvent) => { if (!pointers.current.has(e.pointerId)) return; pointers.current.set(e.pointerId,{ x:e.clientX,y:e.clientY }); const current = snapshot(); const before = last.current; if (current && before) setView(v => ({ x: v.x + current.x-before.x, y:v.y+current.y-before.y, scale:Math.min(6,Math.max(1,v.scale*(before.distance && current.distance ? current.distance/before.distance : 1))) })); last.current=current; };
  const stop = (e: ReactPointerEvent) => { pointers.current.delete(e.pointerId); last.current=snapshot(); };
  const reset = () => setView({ x:0,y:0,scale:1 });
  const zoom = (delta: number) => setView(v => ({ ...v, scale:Math.min(6,Math.max(1,v.scale+delta)) }));
  useEffect(() => { if (!full) return; const previous = document.body.style.overflow; const focus = document.activeElement as HTMLElement; document.body.style.overflow='hidden'; shell.current?.focus(); const key = (e: KeyboardEvent) => { if (e.key==='Escape') setFull(false); if(e.key==='Tab') { const nodes = shell.current?.querySelectorAll<HTMLElement>('button,[tabindex="0"]'); if(!nodes?.length) return; const first=nodes[0],end=nodes[nodes.length-1]; if(e.shiftKey && document.activeElement===first) { e.preventDefault();end.focus(); } else if(!e.shiftKey && document.activeElement===end) { e.preventDefault();first.focus(); } } }; const changed=()=>{if(!document.fullscreenElement)setFull(false);}; addEventListener('keydown',key); document.addEventListener('fullscreenchange',changed); return () => {document.body.style.overflow=previous;removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',changed);if(document.fullscreenElement)void document.exitFullscreen();focus?.focus({preventScroll:true});}; }, [full]);
  return <><PageTitle title="relationships" intro="relationshipsIntro" language={language} />{catalog.relationship ? <div ref={shell} tabIndex={-1} className={`map-shell glass ${full ? 'map-full' : ''}`} role={full ? 'dialog' : undefined} aria-modal={full || undefined} aria-label={copy('relationships',language)}><div className="map-tools"><button className="button button-secondary" onClick={reset}>{copy('reset',language)}</button><button className="icon-button" aria-label={copy('zoomIn',language)} onClick={()=>zoom(.25)}>+</button><button className="icon-button" aria-label={copy('zoomOut',language)} onClick={()=>zoom(-.25)}>−</button><button className="button button-secondary" onClick={()=>{if(full)setFull(false);else {setFull(true);void shell.current?.requestFullscreen?.().catch(()=>{});}}}>{copy(full?'close':'fullscreen',language)}</button><output>{Math.round(view.scale*100)}%</output></div><p>{copy('mapHelp',language)}</p><div ref={stage} className="map-stage" tabIndex={0} aria-label={copy('mapHelp',language)} onKeyDown={e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')zoom(.25);else if(e.key==='-')zoom(-.25);else setView(v=>({...v,x:v.x+(e.key==='ArrowLeft'?-30:e.key==='ArrowRight'?30:0),y:v.y+(e.key==='ArrowUp'?-30:e.key==='ArrowDown'?30:0)}));}}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});last.current=snapshot();}} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><div className="map-transform" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}}><Media src={catalog.relationship.src} alt={localized(catalog.relationship.alt,language)} /></div></div></div> : <Empty title={copy('missingMap',language)} detail={copy('missingMapNote',language)} />}</>;
}
function Typewriter({ brief, full }: { brief: string; full: string }) {
  const enabled = useContext(AnimationContext);
  const [text, setText] = useState(brief);
  useEffect(()=>{if(!enabled){setText(full);return;} setText(brief);let frame=0;const start=performance.now();const tick=(now:number)=>{const elapsed=now-start;const b=Array.from(brief),f=Array.from(full);setText(elapsed<220?b.slice(0,Math.ceil(b.length*(1-elapsed/220))).join(''):f.slice(0,Math.ceil(f.length*Math.min(1,(elapsed-220)/480))).join(''));if(elapsed<700)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[brief,full,enabled]);
  return <p className="product-description"><span className="sr-only">{full}</span><span className="description-reserve" aria-hidden="true">{full}</span><span className="description-ink" aria-hidden="true">{text}</span></p>;
}
function ProductDetail({ product:p, language, onClose }: Props & { product:Product; onClose:()=>void }) {
  const dialog=useRef<HTMLDivElement>(null);
  const enabled=useContext(AnimationContext);
  useEffect(()=>{const focus=document.activeElement as HTMLElement;const top=scrollY;const old=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const elements=dialog.current?.querySelectorAll<HTMLElement>('button,a[href]');if(!elements?.length)return;const first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};addEventListener('keydown',key);return()=>{removeEventListener('keydown',key);document.body.style.overflow=old;scrollTo({top,behavior:'instant'});focus?.focus({preventScroll:true});};},[onClose]);
  return <m.div className="product-overlay" initial={{backgroundColor:'rgba(20,17,12,0)'}} animate={{backgroundColor:'rgba(20,17,12,.55)'}} exit={{backgroundColor:'rgba(20,17,12,0)'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><m.div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="product-title" className="product-detail glass" layoutId={`product-${p.id}`} transition={{duration:enabled?.4:0,ease:[.22,1,.36,1]}}><button className="button button-secondary detail-close" onClick={onClose}>{copy('back',language)} ↗</button><div className="product-detail-grid"><div>{p.image?<Media src={p.image} alt={localized(p.name,language)} />:<div className="product-placeholder"><span>✳</span><small>{copy('placeholder',language)}</small></div>}</div><div><p className="eyebrow">{localized(p.status,language)}</p><h2 id="product-title">{localized(p.name,language)}</h2><Typewriter brief={localized(p.summary,language)} full={localized(p.description,language)} />{p.price&&<p>{p.price}</p>}</div></div><m.div className="product-more" initial={{opacity:0,y:enabled?12:0}} animate={{opacity:1,y:0}} transition={{delay:enabled?.5:0}}>{p.images?.map(src=><Media key={src} src={src} alt={localized(p.name,language)} />)}</m.div></m.div></m.div>;
}
function Shop({ catalog, language }: Props & { catalog:Catalog }) {
  const [selected,setSelected]=useState<Product|null>(null);
  const closeRef=useRef(()=>setSelected(null));
  const placeholders:Product[]=Array.from({length:4},(_,i)=>({id:`placeholder-${i}`,name:{'zh-TW':`商品預留位置 ${String(i+1).padStart(2,'0')}`,en:`Reserved space ${String(i+1).padStart(2,'0')}`},summary:{'zh-TW':copy('placeholder','zh-TW'),en:copy('placeholder','en')},description:{'zh-TW':copy('placeholderDetail','zh-TW'),en:copy('placeholderDetail','en')},status:{'zh-TW':copy('pending','zh-TW'),en:copy('pending','en')},order:i,placeholder:true}));
  const products=catalog.products.length?[...catalog.products].sort((a,b)=>a.order-b.order):placeholders;
  return <><PageTitle title="shop" intro="shopIntro" language={language}/><LayoutGroup><div className="shop-grid" inert={selected?true:undefined}>{products.map(p=><m.button key={p.id} layoutId={`product-${p.id}`} className="product-card glass" onClick={()=>setSelected(p)} animate={{opacity:selected&&selected.id!==p.id?.16:1}} whileHover={{y:-4}} whileTap={{scale:.985}}>{p.image?<Media src={p.image} alt="" retryable={false}/>:<div className="product-placeholder"><span aria-hidden="true">✳</span><small>{copy('placeholder',language)}</small></div>}<div className="product-card-copy"><span className="eyebrow">{localized(p.status,language)}</span><h2>{localized(p.name,language)}</h2><p>{localized(p.summary,language)}</p>{p.price&&<strong>{p.price}</strong>}<span className="text-link">{copy('preview',language)} ↗</span></div></m.button>)}</div><AnimatePresence>{selected&&<ProductDetail product={selected} language={language} onClose={closeRef.current}/>}</AnimatePresence></LayoutGroup></>;
}
export default function ContentPages({ route, language }: Props & { route:string }) {
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [error,setError]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const needsCatalog=['archive','relationships','shop'].includes(route.split('/')[0]);
  useEffect(()=>{if(!needsCatalog)return;const controller=new AbortController();setError(false);fetch(asset('content/catalog.json'),{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('Unavailable');return r.json();}).then(readCatalog).then(setCatalog).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();},[attempt,needsCatalog]);
  if(route==='about')return <div className="content-page page-width"><PageTitle title="about" intro="aboutIntro" language={language}/><p className="about-tagline"><AnimatedText>{site.person.tagline[language]}</AnimatedText></p><Gallery language={language}/><a className="button button-primary" href="#connect">{language==='en'?'Find me online':'來找我聊聊'} ↗</a></div>;
  if(!['archive','relationships','shop'].includes(route.split('/')[0]))return <div className="content-page page-width"><Empty title={copy('notFound',language)}/><a href="#/">{copy('home',language)}</a></div>;
  if(error)return <div className="content-page page-width"><Empty title={copy('loadError',language)}/><button className="button button-secondary" onClick={()=>setAttempt(x=>x+1)}>{copy('retry',language)}</button></div>;
  if(!catalog)return <p className="content-loading page-width" role="status">{copy('loading',language)}</p>;
  return <div className="content-page page-width">{route.startsWith('archive')?<Archive catalog={catalog} language={language} id={route.split('/')[1]}/>:route==='relationships'?<Relationships catalog={catalog} language={language}/>:<Shop catalog={catalog} language={language}/>}</div>;
}
