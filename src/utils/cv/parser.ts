//FRANKESTEIN COMPLETO VIBECODADO, FUNCIONA BEM NO MEU CV E NO DA MINHA NAMORADA E EM ALGUNS OUTROS TESTES, MAS AINDA FALHA EM ALGUNS CASOS BIZARROS. PRECISA DE MAIS TESTES E REFINO.
//PLANEJO MUDAR ISSO PRA ALGO MAIS ROBUSTO, MODULAR E BEM MENOS SLOP.


export interface ExperienceItem {
  cargo: string;
  empresa: string;
  periodo: string;
  descricao: string;
}

export interface EducationItem {
  curso: string;
  instituicao: string;
  periodo: string;
  descricao: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface ResumeData {
  nome: string;
  email: string;
  telefone: string;
  links: string;
  localizacao: string;
  resumo: string;
  experiencias: ExperienceItem[];
  formacao: EducationItem[];
  customSections: CustomSection[];
  habilidades: SkillCategory[];
}

export const emptyResumeData = (): ResumeData => ({
  nome: "",
  email: "",
  telefone: "",
  links: "",
  localizacao: "",
  resumo: "",
  habilidades: [],
  experiencias: [],
  formacao: [],
  customSections: [],
});

export interface SkillCategory {
  id: string;
  categoria: string; 
  itens: string;     
}

const RX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const RX_PHONE =
  /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9\d{4}|[2-9]\d{3})[-.\s]?\d{4}/;
const RX_URL = /https?:\/\/[^\s,)>]+/gi;
const RX_LINK_KW =
  /\b(github(?:\.com\/[^\s,|]*)?|linkedin(?:\.com\/[^\s,|]*)?|gitlab(?:\.com\/[^\s,|]*)?|behance(?:\.net\/[^\s,|]*)?|figma\.com\/[^\s,|]*|portfolio[^\s,|]*)/gi;

const MONTH_NAMES =
  "jan(?:eiro)?|fev(?:ereiro)?|mar(?:ço)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|" +
  "jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?|" +
  "jan?|feb?|mar?|apr?|may|jun?|jul?|aug?|sep?|oct?|nov?|dec?";

const DATE_PART = `(?:\\d{1,2}\\s+)?(?:${MONTH_NAMES})\\.?(?:\\s+de)?\\s+\\d{2,4}|\\d{2}\\/\\d{4}|\\d{4}`;
const RX_DATE_FRAGMENT = new RegExp(
  `\\b(${DATE_PART})\\b`,
  "i"
);

const RX_DATE_RANGE = new RegExp(
  `(${DATE_PART})` +
  `\\s*[-–—~\/a]\\s*` +
  `(${DATE_PART}|atual|presente|em andamento|current|present|hoje)`,
  "i"
);

const RX_DATE_PAREN = /\((\d{4}|em andamento|atual|presente)\)/i;
const RX_DATE_ONLY_LINE = new RegExp(
  `^\\s*(?:${RX_DATE_RANGE.source}|${RX_DATE_FRAGMENT.source}|` +
  `em andamento|atual|presente|current)\\s*\\.?\\s*$`,
  "i"
);

const RX_EMDASH = /[—–]/;
const RX_PIPE = /\|/;
const RX_TITLE_HYPHEN =
  /^([A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ][^\-\n]{2,})\s+-\s+([A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ][^\n]+)$/;

const RX_INSTITUTION_KW =
  /universidade|faculdade|federal|estadual|ifsp|ifsc|fatec|instituto|college|university|escola\s+tec|senai|senac|fiap|usp|unicamp|unesp|puc|mackenzie|unip|anhanguera|kroton|estácio|unicsul|unimes/i;

function normalizeLine(raw: string): string {
  return raw
    .replace(/[●•▪►▸◆◇✓✔·]/g, "- ")
    .replace(/\u00a0/g, " ")          
    .replace(/\u200b/g, "")          
    .replace(/[\x00-\x08\x0b\x0e-\x1f]/g, "") 
    .replace(/\t/g, "  ")
    .replace(/\s{3,}/g, "  ")
    .trim();
}

function injectSectionBreaks(text: string): string {

  const TITLES = [
    // ALL-CAPS
    "EXPERIENCIAS?(?:\\s*PROFISSIONAIS?)?",
    "EXPERIÊNCIAS?(?:\\s*PROFISSIONAIS?)?",
    "HISTORICO\\s*PROFISSIONAL",
    "HISTÓRICO\\s*PROFISSIONAL",
    "FORMACAO(?:\\s*ACADEMICA)?",
    "FORMAÇÃO(?:\\s*ACADÊMICA)?",
    "EDUCAÇÃO", "EDUCACAO",
    "ESCOLARIDADE",
    "HABILIDADES(?:\\s*TECNICAS?)?",
    "HABILIDADES(?:\\s*TÉCNICAS?)?",
    "COMPETENCIAS(?:\\s*TECNICAS?)?",
    "COMPETÊNCIAS(?:\\s*TÉCNICAS?)?",
    "CONHECIMENTOS(?:\\s*TECNICOS?)?",
    "CONHECIMENTOS(?:\\s*TÉCNICOS?)?",
    "RESUMO(?:\\s*PROFISSIONAL)?",
    "OBJETIVO(?:\\s*PROFISSIONAL)?",
    "PERFIL\\s*PROFISSIONAL",
    "INFORMACOES\\s*COMPLEMENTARES",
    "INFORMAÇÕES\\s*COMPLEMENTARES",
    "IDIOMAS?", "CERTIFICACOES?", "CERTIFICAÇÕES?",
    "PROJETOS?", "TECNOLOGIAS", "SKILLS", "STACK",
    // Title-case
    "Experiências?(?:\\s*Profissionais?)?",
    "Experiencias?(?:\\s*Profissionais?)?",
    "Histórico\\s*Profissional",
    "Formação(?:\\s*Acadêmica)?",
    "Formacao(?:\\s*Academica)?",
    "Educação",
    "Escolaridade",
    "Habilidades(?:\\s*[Tt]écnicas?)?",
    "Competências(?:\\s*[Tt]écnicas?)?",
    "Conhecimentos(?:\\s*[Tt]écnicos?)?",
    "Resumo(?:\\s*Profissional)?",
    "Objetivo(?:\\s*Profissional)?",
    "Perfil\\s*Profissional",
    "Informações\\s*Complementares",
    "Idiomas?", "Certificações?",
    "Projetos?", "Tecnologias",
  ].join("|");

  let result = text
    .replace(new RegExp(`([^\\n])[ \\t]*(${TITLES})`, "g"), "$1\n$2")
    .replace(new RegExp(`(${TITLES})[ \\t]+([^\\n])`, "g"), "$1\n$2");

  return result;
}

type SectionKey =
  | "header"
  | "resumo"
  | "experiencia"
  | "formacao"
  | "habilidades"
  | "complementar"
  | "idiomas"
  | "certificacoes"
  | "projetos"
  | "voluntario";

interface SectionRule {
  pattern: RegExp;
  key: SectionKey;
  maxResidual?: number; 
}

const SECTION_RULES: SectionRule[] = [
  {
    pattern:
      /^(?:experiências?\s*profissionais?|experiencias?\s*profissionais?|histórico\s*profissional|experience|work\s*experience|professional\s*experience|atuação\s*profissional)/i,
    key: "experiencia",
  },
  {
    pattern: /^(?:experiências?|experiencias?)/i,
    key: "experiencia",
    maxResidual: 3,
  },
  {
    pattern:
      /^(?:formação\s*acadêmica|formação|formacao|educação|escolaridade|education|academic\s*background)/i,
    key: "formacao",
  },
  {
    pattern:
      /^(?:habilidades\s*técnicas?|habilidades|skills|conhecimentos\s*técnicos?|conhecimentos|competências|competencias|tecnologias|stack|ferramentas)/i,
    key: "habilidades",
  },
  {
    pattern:
      /^(?:resumo\s*profissional|resumo|objetivo\s*profissional|objetivo|perfil\s*profissional|sobre\s*mim|summary|about\s*me|profile|professional\s*summary)/i,
    key: "resumo",
  },
  {
    pattern:
      /^(?:informações\s*complementares|informacoes\s*complementares|additional\s*information|outras\s*informações|sobre)/i,
    key: "complementar",
  },
  {
    pattern: /^(?:idiomas?|languages?|línguas?|fluência)/i,
    key: "idiomas",
  },
  {
    pattern:
      /^(?:certificações?|certifications?|certificados?|cursos?\s*livres?)/i,
    key: "certificacoes",
  },
  {
    pattern: /^(?:projetos?|projects?|portfólio|portfolio|trabalhos?)/i,
    key: "projetos",
  },
  {
    pattern: /^(?:voluntariado|volunteer|trabalho\s*voluntário)/i,
    key: "voluntario",
  },
];


function detectSection(line: string): SectionKey | null {
  const trimmed = line.trim();

  if (trimmed.length > 60) return null;
  if (/^[-•*]/.test(trimmed)) return null;

  const lower = trimmed.toLowerCase();

  for (const rule of SECTION_RULES) {
    if (!rule.pattern.test(lower)) continue;

    const residual = lower
      .replace(rule.pattern, "")
      .replace(/[:.!\s]/g, "")
      .trim();

    const maxResidual = rule.maxResidual ?? 5;
    if (residual.length <= maxResidual) {
      return rule.key;
    }
  }

  return null;
}

function extractDate(input: string): { periodo: string; cleanLine: string } {
  let periodo = "";
  let cleanLine = input;
  const rangeM = input.match(RX_DATE_RANGE);
  if (rangeM) {
    periodo = rangeM[0].trim();
    cleanLine = input.replace(rangeM[0], "");
  } else {
    const parenM = input.match(RX_DATE_PAREN);
    if (parenM) {
      periodo = parenM[1].trim();
      cleanLine = input.replace(parenM[0], "");
    } else {
      const fragM = input.match(RX_DATE_FRAGMENT);
      if (fragM) {
        periodo = fragM[0].trim();
        cleanLine = input.replace(fragM[0], "");
      }
    }
  }

  cleanLine = cleanLine
    .replace(/^[\s,.\-–—|/]+|[\s,.\-–—|/]+$/g, "")
    .trim();

  return { periodo, cleanLine };
}

function isDateOnlyLine(line: string): boolean {
  return RX_DATE_ONLY_LINE.test(line.trim());
}


function isEntryHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (RX_PIPE.test(trimmed) && trimmed.split("|").length >= 2) return true;
  if (RX_EMDASH.test(trimmed) && !/^\s*[—–]/.test(trimmed)) return true;
  if (RX_TITLE_HYPHEN.test(trimmed)) return true;

  if (/^\[.{2,30}\]/.test(trimmed)) return true;

  if (
    RX_INSTITUTION_KW.test(trimmed.split(/[\s,]/)[0] + " " + trimmed.split(/[\s,]/)[1]) &&
    trimmed.length < 120
  )
    return true;

  if (isDateOnlyLine(trimmed)) return false;

  return false;
}

function groupIntoEntryBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (isEntryHeader(line)) {
      if (current.length > 0) blocks.push(current);
      current = [line];
    } else {
      if (current.length === 0) {
        if (RX_DATE_FRAGMENT.test(line) && !isDateOnlyLine(line)) {
          current = [line];
        } else {
          current.push(line);
        }
      } else {
        current.push(line);
      }
    }
  }

  if (current.length > 0) blocks.push(current);
  return blocks.filter((b) => b.join("").trim().length > 1);
}

function parsePipeExperience(block: string[]): ExperienceItem | null {
  const firstLine = block[0];
  if (!RX_PIPE.test(firstLine)) return null;

  const parts = firstLine.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const exp: ExperienceItem = { empresa: "", cargo: "", periodo: "", descricao: "" };

  exp.empresa = parts[0];
  exp.cargo = parts[1];

  if (parts.length >= 3) {
    const { periodo, cleanLine } = extractDate(parts.slice(2).join(" "));
    exp.periodo = periodo || cleanLine;
  }

  let descStart = 1;
  if (!exp.periodo && block.length > 1) {
    const { periodo } = extractDate(block[1]);
    if (periodo) {
      exp.periodo = periodo;
      descStart = 2;
    } else if (isDateOnlyLine(block[1])) {
      exp.periodo = block[1].trim();
      descStart = 2;
    }
  }

  exp.descricao = buildDescription(block, descStart);
  return exp;
}


function parseEmDashExperience(block: string[]): ExperienceItem | null {
  const firstLine = block[0];
  if (!RX_EMDASH.test(firstLine) || /^\s*[—–]/.test(firstLine)) return null;

  const exp: ExperienceItem = { empresa: "", cargo: "", periodo: "", descricao: "" };
  const parts = firstLine.split(/\s*[—–]\s*/);

  exp.empresa = parts[0].replace(/,\s*$/, "").trim();
  const cargoRaw = parts.slice(1).join(" ").trim();

  const { periodo: dateInCargo, cleanLine: cargoClean } = extractDate(cargoRaw);
  if (dateInCargo) {
    exp.periodo = dateInCargo;
    exp.cargo = cargoClean.replace(/\.$/, "").trim();
  } else {
    exp.cargo = cargoRaw.replace(/\.$/, "").trim();
  }

  let descStart = 1;
  if (!exp.periodo && block.length > 1) {
    if (isDateOnlyLine(block[1])) {
      exp.periodo = block[1].trim();
      descStart = 2;
    } else {
      const { periodo } = extractDate(block[1]);
      if (periodo) {
        exp.periodo = periodo;
        descStart = 2;
      } else if (block[1].length < 55 && RX_DATE_FRAGMENT.test(block[1])) {
        exp.periodo = block[1].replace(/\.$/, "").trim();
        descStart = 2;
      }
    }
  }

  exp.descricao = buildDescription(block, descStart);
  return exp;
}


function parseTitleHyphenExperience(block: string[]): ExperienceItem | null {
  const firstLine = block[0];
  const m = firstLine.match(RX_TITLE_HYPHEN);
  if (!m) return null;

  const exp: ExperienceItem = { empresa: "", cargo: "", periodo: "", descricao: "" };

  const { periodo: dateLeft, cleanLine: leftClean } = extractDate(m[1]);
  const { periodo: dateRight, cleanLine: rightClean } = extractDate(m[2]);

  if (dateLeft) {
    exp.periodo = dateLeft;
    exp.empresa = leftClean;
    exp.cargo = m[2].trim();
  } else if (dateRight) {
    exp.periodo = dateRight;
    exp.empresa = m[1].trim();
    exp.cargo = rightClean;
  } else {
    exp.empresa = m[1].trim();
    exp.cargo = m[2].trim();
  }

  let descStart = 1;
  if (!exp.periodo && block.length > 1) {
    const next = block[1];
    if (isDateOnlyLine(next)) {
      exp.periodo = next.trim();
      descStart = 2;
    } else {
      const { periodo } = extractDate(next);
      if (periodo) {
        exp.periodo = periodo;
        descStart = 2;
      }
    }
  }

  exp.descricao = buildDescription(block, descStart);
  return exp;
}

function parseAtsExperience(block: string[]): ExperienceItem {
  const exp: ExperienceItem = { empresa: "", cargo: "", periodo: "", descricao: "" };
  if (block.length === 0) return exp;

  const line0 = block[0];
  const { periodo: d0, cleanLine: c0 } = extractDate(line0);

  if (d0) {
    exp.periodo = d0;
    const parts = c0.split(/\s*[-|]\s*/);
    exp.empresa = parts[0] ?? "";
    exp.cargo = parts[1] ?? "";
    exp.descricao = buildDescription(block, 1);
    return exp;
  }

  exp.cargo = line0;
  let descStart = 1;

  if (block.length > 1) {
    const line1 = block[1];
    const { periodo: d1, cleanLine: c1 } = extractDate(line1);

    if (isDateOnlyLine(line1)) {
      exp.periodo = line1.trim();
      descStart = 2;
    } else if (d1 && c1.length < 3) {
      exp.periodo = d1;
      descStart = 2;
    } else if (d1) {
      exp.empresa = c1;
      exp.periodo = d1;
      descStart = 2;
    } else {
      exp.empresa = line1;
      descStart = 2;

      if (block.length > 2) {
        const { periodo: d2 } = extractDate(block[2]);
        if (d2 || isDateOnlyLine(block[2])) {
          exp.periodo = d2 || block[2].trim();
          descStart = 3;
        }
      }
    }
  }

  exp.descricao = buildDescription(block, descStart);
  return exp;
}


function parseExperienceBlock(block: string[]): ExperienceItem {
  if (block.length === 0)
    return { empresa: "", cargo: "", periodo: "", descricao: "" };

  return (
    parsePipeExperience(block) ??
    parseEmDashExperience(block) ??
    parseTitleHyphenExperience(block) ??
    parseAtsExperience(block)
  );
}


function splitCourseInstitution(
  parts: string[]
): { curso: string; instituicao: string } {
  if (parts.length === 0) return { curso: "", instituicao: "" };
  if (parts.length === 1) {
    const p = parts[0];
    return RX_INSTITUTION_KW.test(p)
      ? { curso: "", instituicao: p }
      : { curso: p, instituicao: "" };
  }

  const instIdx = parts.findIndex((p) => RX_INSTITUTION_KW.test(p));
  if (instIdx === 0) {
    return { instituicao: parts[0], curso: parts.slice(1).join(" ") };
  } else if (instIdx > 0) {
    return {
      curso: parts.slice(0, instIdx).join(" "),
      instituicao: parts.slice(instIdx).join(" "),
    };
  }

  return { curso: parts[0], instituicao: parts.slice(1).join(" ") };
}

function parseEducationBlock(block: string[]): EducationItem {
  const form: EducationItem = {
    instituicao: "",
    curso: "",
    periodo: "",
    descricao: "",
  };
  if (block.length === 0) return form;

  let firstLine = block[0].trim();
  let descStart = 1;

  firstLine = firstLine.replace(/^\[.{2,40}\]\s*/, "");
  if (/^(?:cursando|em andamento)\s+/i.test(firstLine)) {
    form.periodo = "Em andamento";
    firstLine = firstLine.replace(/^(?:cursando|em andamento)\s+/i, "");
  }

  if (!form.periodo) {
    const { periodo, cleanLine } = extractDate(firstLine);
    if (periodo) {
      form.periodo = periodo;
      firstLine = cleanLine;
    }
  }

  let rawParts: string[] = [];

  if (RX_PIPE.test(firstLine)) {
    rawParts = firstLine.split("|").map((p) => p.trim()).filter(Boolean);
  } else if (RX_EMDASH.test(firstLine) && !/^\s*[—–]/.test(firstLine)) {
    rawParts = firstLine.split(/\s*[—–]\s*/).map((p) => p.trim()).filter(Boolean);
  } else if (RX_TITLE_HYPHEN.test(firstLine)) {
    const m = firstLine.match(RX_TITLE_HYPHEN)!;
    rawParts = [m[1].trim(), m[2].trim()];
  } else {
    rawParts = [firstLine];
  }

  const { curso, instituicao } = splitCourseInstitution(rawParts);
  form.curso = curso;
  form.instituicao = instituicao;

  if (!form.periodo && block.length > 1) {
    const line1 = block[1];
    if (isDateOnlyLine(line1)) {
      form.periodo = line1.trim();
      descStart = 2;
    } else {
      const { periodo, cleanLine } = extractDate(line1);
      if (periodo) {
        form.periodo = periodo;
        if (cleanLine.length < 4) descStart = 2;
      }
    }
  }

  if (
    descStart === 1 &&
    block.length > 1 &&
    block[1].trim() === form.periodo
  ) {
    descStart = 2;
  }

  form.descricao = buildDescription(block, descStart);
  form.curso = form.curso.replace(/[.,]+$/, "").trim();
  form.instituicao = form.instituicao.replace(/[.,]+$/, "").trim();

  return form;
}

function parseSkills(lines: string[]): string {
  const categories: string[] = [];
  const loose: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/^[-•*]\s*/, "").trim();
    if (!line) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 35) {
      const label = line.slice(0, colonIdx).trim();
      const items = line.slice(colonIdx + 1).trim();

      if (items.length > 0) {
        const normalizedItems = items
          .replace(/\be\b/g, ",")      
          .replace(/[|/\\]/g, ",")
          .split(",")
          .map((s) =>
            s
              .trim()
              .replace(/\.$/, "")
              .replace(/\bjavascript\b/i, "JavaScript")
              .replace(/\btypescript\b/i, "TypeScript")
              .replace(/\bpython\b/i, "Python")
          )
          .filter((s) => s.length > 0)
          .join(", ");

        if (normalizedItems) {
          categories.push(`${label}: ${normalizedItems}`);
        }
      } else {
        loose.push(label);
      }
      continue;
    }

    const items = line
      .replace(/[|/\\]/g, ",")
      .split(",")
      .map((s) => s.trim().replace(/\.$/, ""))
      .filter((s) => s.length > 0);

    loose.push(...items);
  }

  const parts: string[] = [];
  if (loose.length > 0) parts.push(loose.join(", "));
  if (categories.length > 0) parts.push(...categories);

  return parts.join("; ");
}

function parseLanguages(lines: string[]): string {
  return lines
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildDescription(block: string[], fromIdx: number): string {
  return block
    .slice(fromIdx)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 0)
    .join("\n");
}


function dedup<T extends string>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    const key = s.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface HeaderData {
  nome: string;
  email: string;
  telefone: string;
  localizacao: string;
  links: string[];
}

function extractHeader(lines: string[]): HeaderData {
  const result: HeaderData = {
    nome: "",
    email: "",
    telefone: "",
    localizacao: "",
    links: [],
  };

  for (const line of lines) {
    // Email
    const emailM = line.match(RX_EMAIL);
    if (emailM && !result.email) result.email = emailM[0];

    // Telefone
    const phoneM = line.match(RX_PHONE);
    if (phoneM && !result.telefone) result.telefone = phoneM[0];

    // URLs com protocolo
    const urlMatches = line.match(RX_URL);
    if (urlMatches) result.links.push(...urlMatches.map((u) => u.replace(/[,.)>]+$/, "")));

    const kwMatches = line.match(RX_LINK_KW);
    if (kwMatches) {
      kwMatches.forEach((m) => {
        const clean = m.trim().replace(/[,.)>]+$/, "");
        if (!result.links.some((l) => l.includes(clean))) {
          result.links.push(clean);
        }
      });
    }

    const clean = line
      .replace(RX_URL, "")
      .replace(RX_EMAIL, "")
      .replace(RX_PHONE, "")
      .replace(RX_LINK_KW, "")
      .replace(
        /\b(github|linkedin|gitlab|behance|portfolio|twitter|instagram)\b/gi,
        ""
      )
      .replace(/[|]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (clean.length < 3) continue;

    if (!result.nome && /^[A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ]/.test(clean)) {
      let nome = clean
        .replace(/,?\s*\d{1,2}\s*anos?\.?\s*$/i, "")
        .replace(/,\s*\d{1,2}\s*$/i, "")
        .trim();

      const commaIdx = nome.indexOf(",");
      if (commaIdx > 0) {
        const beforeComma = nome.slice(0, commaIdx).trim();
        const wordsBefore = beforeComma.split(/\s+/).filter(Boolean);
        nome = wordsBefore.length <= 4 ? beforeComma : wordsBefore.slice(0, 3).join(" ");
      } else {
        const words = nome.split(/\s+/).filter(Boolean);
        if (words.length > 5) {
          let cutAt = Math.min(words.length, 4);
          for (let wi = 2; wi < words.length; wi++) {
            if (/^(de|do|da|dos|das)$/i.test(words[wi])) { cutAt = wi; break; }
          }
          nome = words.slice(0, cutAt).join(" ");
        }
      }

      if (nome.includes(" ") || nome.length > 8) {
        result.nome = nome;
        continue;
      }
    }

    if (
      !result.localizacao &&
      result.nome && 
      clean.length < 70 &&
      /^[A-ZÁÀÃÂÉÊÍÓÔÕÚÜÇ]/.test(clean) &&
      !RX_DATE_FRAGMENT.test(clean)
    ) {
      const loc = clean
        .replace(/\.\s*\d{1,2}\s*anos?\.?\s*$/i, "")
        .replace(/,?\s*\d{1,2}\s*anos?\.?\s*$/i, "")
        .replace(/\.$/, "")
        .trim();

      if (
        loc.includes(",") ||
        /\b(SP|RJ|MG|RS|BA|PR|PE|CE|SC|GO|AM|PA|ES|PB|RN|AL|MT|MS|SE|RO|TO|AC|AP|RR|DF|MA|PI)\b/.test(
          loc
        )
      ) {
        result.localizacao = loc;
      }
    }
  }

  return result;
}

function parseSkillsCategorized(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];
  const looseItems: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/^[-•*]\s*/, "").trim();
    if (!line) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 35) {
      const label = line.slice(0, colonIdx).trim();
      const items = line.slice(colonIdx + 1).trim();

      if (items.length > 0) {
        categories.push({
          id: crypto.randomUUID(),
          categoria: label,
          itens: items.replace(/[|/\\]/g, ", ").replace(/\s{2,}/g, " ")
        });
        continue;
      }
    }

    looseItems.push(line);
  }

  if (looseItems.length > 0) {
    categories.push({
      id: crypto.randomUUID(),
      categoria: "Geral",
      itens: looseItems.join(", ")
    });
  }

  return categories;
}

export const parseResumeText = (text: string): ResumeData => {
  const data = emptyResumeData();

  try {
    const injected = injectSectionBreaks(text);
    const normalized = injected.replace(/\r\n|\r/g, "\n");
    const lines = normalized
      .split("\n")
      .map(normalizeLine)
      .filter((l) => l.length > 0);

    let currentSection: SectionKey = "header";
    const blocks: Record<SectionKey, string[]> = {
      header: [], resumo: [], experiencia: [], formacao: [],
      habilidades: [], complementar: [], idiomas: [],
      certificacoes: [], projetos: [], voluntario: [],
    };

    for (const line of lines) {
      const section = detectSection(line);
      if (section) {
        currentSection = section;
        continue;
      }
      blocks[currentSection].push(line);
    }

    const header = extractHeader(blocks.header);
    data.nome = header.nome;
    data.email = header.email;
    data.telefone = header.telefone;
    data.localizacao = header.localizacao;
    data.links = dedup(header.links).join(" | ");

    data.resumo = [
      ...blocks.resumo,
      ...(blocks.resumo.length === 0 ? blocks.complementar : []),
    ].map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).join(" ");

    const skillLines = [
      ...blocks.habilidades,
      ...blocks.projetos.filter(l => l.toLowerCase().includes("tech") || l.includes(":")),
    ];
    
    data.habilidades = parseSkillsCategorized(skillLines);

    if (blocks.idiomas.length > 0) {
      data.habilidades.push({
        id: crypto.randomUUID(),
        categoria: "Idiomas",
        itens: blocks.idiomas.map(l => l.replace(/^[-•*]\s*/, "").trim()).join(", ")
      });
    }

    if (blocks.certificacoes.length > 0) {
      data.habilidades.push({
        id: crypto.randomUUID(),
        categoria: "Certificações",
        itens: blocks.certificacoes.map(l => l.replace(/^[-•*]\s*/, "").trim()).join(", ")
      });
    }

    data.experiencias = groupIntoEntryBlocks(blocks.experiencia)
      .map(parseExperienceBlock)
      .filter((e) => (e.empresa || e.cargo).trim().length > 0);


    data.formacao = groupIntoEntryBlocks(blocks.formacao)
      .map(parseEducationBlock)
      .filter((f) => (f.curso || f.instituicao).trim().length > 0);

  } catch (err) {
    console.error("[parser] Falha crítica:", err);
    data.resumo = text.slice(0, 2000);
  }

  return data;
};