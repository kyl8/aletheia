import { createEmptyResume, blankExperience, blankEducation, blankSkill, blankSection, type ResumeData } from './types.ts';

const rxEmail = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/;
const rxPhone = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?(?:9?\d{4})[\s.-]?\d{4}/;
const rxUrl = /(?:https?:\/\/|www\.)[^\s,;]+|(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|[\w-]+\.dev)(?:\/[^\s,;]*)?/gi;
const rxRange = /(?:\b(?:19|20)\d{2}\b|\b\d{1,2}[/.]\d{4}\b|\b(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec)[a-zç]*\.?\s+(?:de\s+)?\d{4})\s*(?:-|–|—|a|até|to)\s*(?:(?:19|20)\d{2}|\d{1,2}[/.]\d{4}|atual|presente|current|present|hoje)/i;
const rxYear = /\b(?:19|20)\d{2}\b/;
const rxBullet = /^[-•●*▪\u2022]\s*/;
type Section = 'header' | 'resumo' | 'experiencias' | 'formacao' | 'habilidades' | 'projetos' | 'idiomas' | 'certificacoes' | 'outros';
const headings: {key:Section; rx:RegExp}[] = [
  {key:'resumo',rx:/^(?:resumo(?: profissional)?|perfil profissional|objetivo(?: profissional)?|sobre mim|summary|about me|profile)\s*:?$/i},
  {key:'experiencias',rx:/^(?:experi[eê]ncia(?:s)?(?: profissiona(?:l|is))?|hist[oó]rico profissional|work experience|employment|professional experience)\s*:?$/i},
  {key:'formacao',rx:/^(?:forma[çc][aã]o(?: acad[eê]mica)?|educa[çc][aã]o|escolaridade|education|academic background)\s*:?$/i},
  {key:'habilidades',rx:/^(?:habilidades(?: t[eé]cnicas?)?|compet[eê]ncias|conhecimentos|tecnologias|skills|tech stack|ferramentas)\s*:?$/i},
  {key:'projetos',rx:/^(?:projetos?|projects?|portf[oó]lio)\s*:?$/i},
  {key:'idiomas',rx:/^(?:idiomas?|languages?)\s*:?$/i},
  {key:'certificacoes',rx:/^(?:certifica[çc][oõ]es|certificados?|certifications?|cursos livres)\s*:?$/i}
];
const institutionRx = /\b(?:universidade|faculdade|instituto|fatec|ifsp|unifesp|usp|uf\w+|college|university|senai|senac|escola|puc|fiap|unip|unicamp)\b/i;
function splitEntries(lines:string[]):string[][] {
  const blocks:string[][] = [];
  let cur:string[]=[];
  for (const line of lines) {
    if (!line.trim()) { if(cur.length){blocks.push(cur);cur=[];} continue; }
    // Blank lines normally separate entries. A year-range line at the end of an entry remains attached.
    cur.push(line.trim());
  }
  if(cur.length) blocks.push(cur);
  return blocks;
}
function cleanLine(line:string) {return line.replace(rxBullet,'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();}
function inferPeriod(s:string) { return s.match(rxRange)?.[0] ?? (s.match(/\b(?:19|20)\d{2}\b/g)?.join(' - ') ?? ''); }
function parseExperience(block:string[]) {
  const item=blankExperience();
  if (!block.length) return item;
  const head = cleanLine(block[0]);
  const parts=head.split(/\s+[|—–]\s+|\s+-\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const firstInstitution = /(ltda|s\.a\.|inc\.|company|empresa|prefeitura|bank|banco|studio|tech|sistemas)/i.test(parts[0]);
    item.empresa = firstInstitution?parts[0]:parts[1];
    item.cargo = firstInstitution?parts[1]:parts[0];
  } else item.cargo=head;
  const found=block.map(inferPeriod).find(Boolean);
  item.periodo=found??'';
  const rest=block.slice(1).filter(line=>line.trim()!==item.periodo);
  if(!item.empresa && rest.length && !rxYear.test(rest[0]) && !rxBullet.test(rest[0]) && rest[0].length<80){item.empresa=cleanLine(rest.shift()!);}
  item.descricao=rest.map(cleanLine).filter(Boolean).join('\n');
  return item;
}
function parseEducation(block:string[]) {
  const item=blankEducation();
  const head=cleanLine(block[0]??'');
  const parts=head.split(/\s+[|—–]\s+|\s+-\s+/).filter(Boolean);
  if(parts.length>=2) {
    const idx=parts.findIndex(x=>institutionRx.test(x));
    if(idx>=0){ item.instituicao=parts[idx]; item.curso=parts.filter((_,i)=>i!==idx).join(' - '); }
    else {item.curso=parts[0];item.instituicao=parts.slice(1).join(' - ');}
  } else if(institutionRx.test(head)) item.instituicao=head;
  else item.curso=head;
  item.periodo=block.map(inferPeriod).find(Boolean)??'';
  const rest=block.slice(1).filter(x=>x.trim()!==item.periodo);
  if(!item.instituicao && rest.length && institutionRx.test(rest[0])) item.instituicao=cleanLine(rest.shift()!);
  if(!item.curso && rest.length && !rxYear.test(rest[0])) item.curso=cleanLine(rest.shift()!);
  item.descricao=rest.map(cleanLine).filter(Boolean).join('\n');
  return item;
}
export function parseResumeText(raw:string):ResumeData {
  const resume=createEmptyResume();
  if(!raw.trim()) return resume;
  const lines=raw.replace(/\r\n?/g,'\n').split('\n').map(x=>x.trim());
  const sections:Record<Section,string[]> = {header:[],resumo:[],experiencias:[],formacao:[],habilidades:[],projetos:[],idiomas:[],certificacoes:[],outros:[]};
  let section:Section='header';
  for(const line of lines){
    const heading=headings.find(x=>x.rx.test(line));
    if(heading){section=heading.key;continue;}
    sections[section].push(line);
  }
  const header=sections.header.filter(Boolean);
  resume.email=raw.match(rxEmail)?.[0]??'';
  resume.telefone=header.join('\n').match(rxPhone)?.[0]??'';
  const urls=Array.from(raw.matchAll(rxUrl)).map(x=>x[0]).filter(x=>!x.includes('@'));
  resume.links=[...new Set(urls)].filter(x=>/(?:linkedin|github|gitlab|behance|portfolio|portfolio|\.(?:dev|com|io|me|net|br)\b)/i.test(x)).slice(0,6).join(', ');
  resume.nome=header.find(x=>x.length>3 && x.length<85 && !rxEmail.test(x) && !rxPhone.test(x) && !/https?:|github|linkedin|curriculum|curr[ií]culo|resume|telefone|e-mail/i.test(x))??'';
  resume.localizacao=header.find(x=>/(?:[A-Za-zÀ-ÿ]+\s*[,\-/]\s*[A-Z]{2}\b|remoto|brazil|brasil|são paulo)/i.test(x) && x!==resume.nome)??'';
  resume.resumo=sections.resumo.map(cleanLine).filter(Boolean).join(' ');
  const experienceBlocks=splitEntries(sections.experiencias);
  resume.experiencias=experienceBlocks.map(parseExperience).filter(x=>x.cargo||x.empresa);
  const educationBlocks=splitEntries(sections.formacao);
  resume.formacao=educationBlocks.map(parseEducation).filter(x=>x.curso||x.instituicao);
  const skills=sections.habilidades.filter(Boolean).map(cleanLine);
  if(skills.length){
    for (const s of skills){
      const m=s.match(/^([^:]{2,35}):\s*(.+)$/);
      const skill=blankSkill();
      skill.categoria=m?.[1]??(skills.length===1?'Principais':'Outras');
      skill.itens=m?.[2]??s;
      resume.habilidades.push(skill);
    }
  }
  for(const [key,title] of [['projetos','Projetos'],['idiomas','Idiomas'],['certificacoes','Certificações']] as const){
    const body=sections[key].filter(Boolean).join('\n');
    if(body) resume.secoes.push({...blankSection(),titulo:title,conteudo:body});
  }
  return resume;
}
function getString(value:unknown){return typeof value==='string'?value.slice(0,20000):'';}
function objectOrEmpty(value:unknown):Record<string,unknown>{return value && typeof value==='object' && !Array.isArray(value)? value as Record<string,unknown>:{};}
export function normalizeResumeData(input:unknown):ResumeData {
  const obj=objectOrEmpty(input); const r=createEmptyResume();
  for(const key of ['nome','email','telefone','localizacao','links','resumo'] as const) r[key]=getString(obj[key]);
  const experienceArray=Array.isArray(obj.experiencias)?obj.experiencias:[];
  r.experiencias=experienceArray.slice(0,30).map(value=>{const v=objectOrEmpty(value);return {id:getString(v.id)||blankExperience().id,cargo:getString(v.cargo),empresa:getString(v.empresa),periodo:getString(v.periodo),local:getString(v.local),tipo:getString(v.tipo),descricao:getString(v.descricao)};});
  const educationArray=Array.isArray(obj.formacao)?obj.formacao:[];
  r.formacao=educationArray.slice(0,30).map(value=>{const v=objectOrEmpty(value);return {id:getString(v.id)||blankEducation().id,curso:getString(v.curso),instituicao:getString(v.instituicao),periodo:getString(v.periodo),descricao:getString(v.descricao)};});
  const skillsArray=Array.isArray(obj.habilidades)?obj.habilidades:[];
  r.habilidades=skillsArray.slice(0,50).map(value=>{const v=objectOrEmpty(value);return {id:getString(v.id)||blankSkill().id,categoria:getString(v.categoria),itens:getString(v.itens)};});
  const extraArray=Array.isArray(obj.secoes)?obj.secoes:Array.isArray(obj.customSections)?obj.customSections:[];
  r.secoes=extraArray.slice(0,30).map(value=>{const v=objectOrEmpty(value);return {id:getString(v.id)||blankSection().id,titulo:getString(v.titulo)||getString(v.title),conteudo:getString(v.conteudo)||getString(v.content)};});
  return r;
}
