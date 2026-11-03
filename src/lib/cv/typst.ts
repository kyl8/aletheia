import type { ResumeData } from './types.ts';

export type CvLang='pt'|'en';
export function escapeTypst(value:string):string {
  return (value??'').replace(/[\\#\[\]*_@$<>]/g, '\\$&');
}
const text=(s:string)=>escapeTypst(s).replace(/\n/g,'\n');
const lineItems=(s:string)=>s.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>`- ${text(x.replace(/^[-•]\s*/,''))}`).join('\n');
function safeLink(raw:string):string|null{
  try{const trimmed=raw.trim();const value=/^https?:\/\//i.test(trimmed)?trimmed:`https://${trimmed}`;const u=new URL(value);return (u.protocol==='https:'||u.protocol==='http:')?u.href:null;}catch{return null;}
}
function quote(value:string):string{return (value??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,' ');}
export function generateTypstSource(data:ResumeData,lang:CvLang='pt'):string {
  const pt=lang==='pt';
  const heading=(name:string)=>`= ${text(name)}\n`;
  const contacts=[data.localizacao,data.email,data.telefone].filter(Boolean).map(text).join('  •  ');
  const links=data.links.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).map(link=>{
    const url=safeLink(link);return url?`#link("${quote(url)}")[${text(link.replace(/^https?:\/\//,''))}]`:text(link);
  }).join('  •  ');
  const exp=data.experiencias.filter(x=>x.cargo||x.empresa).map(x=>`#grid(columns:(1fr,auto),gutter:8pt,[*${text(x.cargo||x.empresa)}*],[*${text(x.periodo)}*])\n${x.empresa&&x.cargo?`_${text(x.empresa)}_`:''}${x.local?`  •  ${text(x.local)}`:''}${x.tipo?`  •  ${text(x.tipo)}`:''}\n${lineItems(x.descricao)}\n#v(0.3em)`).join('\n');
  const educ=data.formacao.filter(x=>x.curso||x.instituicao).map(x=>`#grid(columns:(1fr,auto),gutter:8pt,[*${text(x.curso||x.instituicao)}*],[*${text(x.periodo)}*])\n_${text(x.instituicao)}_\n${lineItems(x.descricao)}\n#v(0.3em)`).join('\n');
  const skills=data.habilidades.filter(x=>x.categoria||x.itens).map(x=>`- *${text(x.categoria||'Habilidades')}:* ${text(x.itens)}`).join('\n');
  const sections=data.secoes.filter(x=>x.titulo&&x.conteudo).map(x=>`${heading(x.titulo)}${lineItems(x.conteudo)}\n`).join('\n');
  return `#set document(title: "${quote(data.nome||'Currículo')}")
#set page(paper:"a4", margin:(top:1.45cm,bottom:1.35cm,left:1.55cm,right:1.55cm))
#set text(size:10pt,lang:"${pt?'pt':'en'}")
#set par(leading:0.62em)
#show heading.where(level:1): it => { set text(size:11.5pt,weight:"bold"); block(above:0.75em,below:0.25em)[#upper(it.body) #line(length:100%,stroke:0.5pt)] }
#show link: set text(fill:rgb("#304ab6"))
#align(center)[
  #text(size:18pt,weight:"bold")[${text(data.nome|| (pt?'Seu nome':'Your name'))}]
  #v(0.15em)
  #text(size:9pt)[${contacts}]
  ${links?`#linebreak() #text(size:8pt)[${links}]`:''}
]
${data.resumo?`\n${heading(pt?'Resumo profissional':'Professional summary')}${text(data.resumo)}\n`:''}
${exp?`\n${heading(pt?'Experiência profissional':'Professional experience')}${exp}\n`:''}
${skills?`\n${heading(pt?'Habilidades':'Skills')}${skills}\n`:''}
${educ?`\n${heading(pt?'Formação acadêmica':'Education')}${educ}\n`:''}
${sections}`;
}
let initPromise:Promise<void>|undefined;
async function prepareTypst(){
  if(initPromise) return initPromise;
  initPromise=(async()=>{
    const { $typst }=await import('@myriaddreamin/typst.ts');
    const compiler=await import('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url');
    const renderer=await import('@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url');
    await $typst.setCompilerInitOptions({getModule:()=>compiler.default});
    await $typst.setRendererInitOptions({getModule:()=>renderer.default});
  })().catch(e=>{initPromise=undefined;throw e;});
  return initPromise;
}
export async function compileTypstSource(source:string):Promise<Blob>{
  await prepareTypst();
  const {$typst}=await import('@myriaddreamin/typst.ts');
  const output=await $typst.pdf({mainContent:source});
  if(!output) throw new Error('O motor Typst não gerou PDF.');
  // Copy into a fresh ArrayBuffer to avoid TypeScript generic ArrayBufferLike errors.
  const bytes=new Uint8Array(output);
  const buffer=new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer],{type:'application/pdf'});
}
export function saveBlob(blob:Blob,name:string){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),60_000);
}
