export interface Experience {
  id: string;
  cargo: string;
  empresa: string;
  periodo: string;
  local: string;
  tipo: string;
  descricao: string;
}
export interface Education {
  id: string;
  curso: string;
  instituicao: string;
  periodo: string;
  descricao: string;
}
export interface SkillGroup { id: string; categoria: string; itens: string; }
export interface CustomSection { id: string; titulo: string; conteudo: string; }
export interface ResumeData {
  nome: string;
  email: string;
  telefone: string;
  localizacao: string;
  links: string;
  resumo: string;
  experiencias: Experience[];
  formacao: Education[];
  habilidades: SkillGroup[];
  secoes: CustomSection[];
}
export function createEmptyResume(): ResumeData {
  return { nome:'', email:'', telefone:'', localizacao:'', links:'', resumo:'', experiencias:[], formacao:[], habilidades:[], secoes:[] };
}
let counter = 0;
export const newId = () => `item-${++counter}-${Math.random().toString(36).slice(2,8)}`;
export function blankExperience(): Experience { return {id:newId(), cargo:'', empresa:'', periodo:'', local:'', tipo:'', descricao:''}; }
export function blankEducation(): Education { return {id:newId(), curso:'', instituicao:'', periodo:'', descricao:''}; }
export function blankSkill(): SkillGroup { return {id:newId(), categoria:'', itens:''}; }
export function blankSection(): CustomSection { return {id:newId(), titulo:'', conteudo:''}; }
