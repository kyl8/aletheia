import type { ResumeData } from "./parser";
import { type Lang, t } from "../i18n";
import { $typst } from "@myriaddreamin/typst.ts";

export function generateTypstSource(data: ResumeData, lang: Lang): string {
  const esc = (s: string) => s?.replace(/[#$@\\]/g, (c) => `\\${c}`) || "";
  const name = esc(data.nome || (lang === "pt" ? "Seu Nome" : "Your Name"));

  const processedLinks = data.links
    ? data.links
        .split(/[,;|\n]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(link => {
          const href = link.startsWith("http") ? link : `https://${link}`;
          const display = link.replace(/^https?:\/\//, "").replace(/\/$/, "");
          return `#link("${href}")[${esc(display)}]`;
        })
        .join("  •  ")
    : "";

  const headerItems = [];
  if (data.localizacao) headerItems.push(esc(data.localizacao));
  if (data.email) headerItems.push(`#link("mailto:${data.email}")[${esc(data.email)}]`);
  if (data.telefone) {
    const digits = data.telefone.replace(/\D/g, "");
    const waNumber = (digits.length === 10 || digits.length === 11) ? `55${digits}` : digits;
    headerItems.push(`#link("https://wa.me/${waNumber}")[${esc(data.telefone)}]`);
  }
  const headerText = headerItems.join("  •  ");

  return `
#set document(title: "${name}", author: "${name}")
#set page(
  paper: "a4", 
  margin: (top: 1.25cm, bottom: 1.25cm, left: 1.5cm, right: 1.5cm)
)

#set text(size: 10pt, lang: "pt")
#set par(justify: true, leading: 0.6em)

// --- ESTILO DOS LINKS (O QUE VOCÊ PEDIU) ---
#show link: set text(fill: rgb("#1155cc"))
#show link: underline.with(stroke: 0.5pt + rgb("#1155cc"), offset: 1.5pt)
// -------------------------------------------

// titulo das seções
#show heading.where(level: 1): it => [
  #set text(size: 12pt, weight: "bold")
  #upper(it.body)
  #v(-0.8em)
  #line(length: 100%, stroke: 0.5pt)
  #v(0.2em)
]

#show heading.where(level: 2): it => [
  #set text(size: 10pt, weight: "bold")
  #it.body
]

// cabeçalho
#align(center)[
  #text(18pt, weight: "bold")[${name}] \\
  #v(0.1cm)
  #text(9pt)[${headerText}] 
  ${processedLinks ? `\\ \n #text(8pt)[${processedLinks}]` : ""}
]

${data.resumo ? `= ${t("pdfSummary", lang)}\n${esc(data.resumo)}\n` : ""}

= ${t("experienceTitle", lang)}
${data.experiencias.map(exp => `
#grid(
  columns: (1fr, auto),
  gutter: 10pt,
  [== ${esc(exp.empresa)}],
  [#text(weight: "bold")[${esc(exp.periodo)}]]
)
#v(-0.6em)
#grid(
  columns: (1fr, auto),
  gutter: 10pt,
  [#emph[${esc(exp.cargo)}]],
  [#text(size: 9pt)[${[exp.local, exp.tipo].filter(Boolean).join(" — ")}]]
)
#v(0.1em)
${exp.descricao?.split('\n').filter(Boolean).map(line => `  - ${esc(line.trim())}`).join('\n')}
`).join('\n')}

= ${t("pdfSkills", lang)}
#v(0.2em)
${data.habilidades.map(s => `  - *${esc(s.categoria)}:* ${esc(s.itens)}`).join('\n')}

= ${t("educationTitle", lang)}
${data.formacao.map((edu: any) => {
  const statusText = edu.status ? edu.status.charAt(0).toUpperCase() + edu.status.slice(1).toLowerCase() : "";
  const statusRight = statusText ? `[#text(size: 9pt)[#emph[${esc(statusText)}]]]` : "[]";
  
  return `
#grid(
  columns: (1fr, auto),
  gutter: 10pt,
  [== ${esc(edu.instituicao)}],
  [#text(weight: "bold")[${esc(edu.periodo)}]]
)
#v(-0.6em)
#grid(
  columns: (1fr, auto),
  gutter: 10pt,
  [#emph[${esc(edu.curso)}]],
  ${statusRight}
)
#v(0.1em)
${esc(edu.descricao || "")}
`;
}).join('\n')}
`;
}

let isCompilerInitialized = false;

async function initTypstCompiler() {
  if (isCompilerInitialized) return;
  
  await $typst.setCompilerInitOptions({
    getModule: () =>
      'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm',
  });

  await $typst.setRendererInitOptions({
    getModule: () =>
      'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm',
  });
  isCompilerInitialized = true;
}

export async function compileTypstToPdf(data: ResumeData, lang: Lang): Promise<string> {
  await initTypstCompiler();
  const content = generateTypstSource(data, lang);
  
  try {
    const pdfBytes = await $typst.pdf({ mainContent: content });
    if (!pdfBytes) {
      throw new Error("Typst renderer returned empty PDF");
    }
    const normalizedPdfBytes = new Uint8Array(pdfBytes);
    const blob = new Blob([normalizedPdfBytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Erro ao compilar PDF:", err);
    throw new Error("Erro de compilação. Verifique a conexão com o CDN de fontes e WASM.");
  }
}

export function downloadTypst(data: ResumeData, lang: Lang) {
  const content = generateTypstSource(data, lang);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fileName = (data.nome || "curriculo").replace(/\s+/g, "_");
  a.download = `${fileName}.typ`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}