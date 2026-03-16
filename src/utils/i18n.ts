export type Lang = "pt" | "en";

export const labels = {
  appName: { pt: "Aletheia", en: "Aletheia" },
  subtitle: {pt: "Uma coleção de ferramentas para me ajudar. (ou  ajudar você)", en: "A bunch of tools to help me. (or you)" },

  // Upload
  uploadTitle: { pt: "Extrair informações de Arquivo", en: "Extract from File" },
  uploadDesc: { pt: "Uma llm local pega informações do seu CV para você. (Passível de travamentos e erros de parsing, exige correção humana)  ", en: "A local LLM extracts information from your CV. (May stutter and error parsing, requires manual correction)  " },
  uploadProcessing: { pt: "Processando...", en: "Processing..." },
  scratchTitle: { pt: "Criar CV do zero.", en: "Create from Scratch" },
  scratchDesc: { pt: "Crie um CV otimizado do zero.", en: "Create an optimized CV from scratch." },

  // Toolbar
  reset: { pt: "Reiniciar", en: "Reset" },
  resetConfirm: { pt: "Deseja resetar todo o progresso?", en: "Reset all progress?" },
  exportPDF: { pt: "Exportar PDF", en: "Export PDF" },
  exportDOCX: { pt: "Exportar DOCX", en: "Export DOCX" },
  exportTypst: { pt: "Baixar Typst", en: "Download Typst" },
  generating: { pt: "Gerando...", en: "Generating..." },
  export: { pt: "Exportar", en: "Export" },

  // AI Panel
  aiTitle: { pt: "AI Engine Runtime", en: "AI Engine Runtime" },
  aiRunning: { pt: "EXECUTANDO...", en: "RUNNING..." },
  aiExec: { pt: "EXEC_IA", en: "EXEC_AI" },
  aiWaiting: { pt: "// Aguardando instrução...", en: "// Awaiting instruction..." },
  aiNoText: { pt: "[WARN] Nenhum texto para processar.", en: "[WARN] No text to process." },
  aiStarting: { pt: "[SYS] Iniciando motor", en: "[SYS] Starting engine" },
  aiDone: { pt: "[OK] IA concluiu otimização.", en: "[OK] AI finished optimization." },
  aiExtractingFile: { pt: "[SYS] Extraindo texto do arquivo...", en: "[SYS] Extracting text from file..." },
  aiFile: { pt: "[SYS] Arquivo", en: "[SYS] File" },
  aiExtracted: { pt: "[OK] Texto extraído", en: "[OK] Text extracted" },
  aiLocalDone: { pt: "[OK] Parse local concluído.", en: "[OK] Local parse completed." },
  aiHint: { pt: "[SYS] Pressione EXEC_IA para otimizar com IA ou edite manualmente.", en: "[SYS] Press EXEC_AI to optimize with AI or edit manually." },

  // Form - Identity
  identityTitle: { pt: "Identidade", en: "Identity" },
  fullName: { pt: "Nome Completo", en: "Full Name" },
  email: { pt: "E-mail", en: "Email" },
  phone: { pt: "Telefone", en: "Phone" },
  location: { pt: "Localização", en: "Location" },
  skills: { pt: "Habilidades (Tags)", en: "Skills (Tags)" },
  professionalLinks: { pt: "Links Profissionais (separados por vírgula)", en: "Professional Links (separated by comma)" },
  summaryLabel: { pt: "Resumo Profissional", en: "Professional Summary" },
  summaryPlaceholder: { pt: "Descreva seu perfil profissional...", en: "Describe your professional profile..." },

  //Form - Skills
  skillsTitle: { pt: "Habilidades", en: "Skills" },
  skillCategory: { pt: "Categoria", en: "Category" },
  
  // Form - Experience
  experienceTitle: { pt: "Experiência Profissional", en: "Professional Experience" },
  company: { pt: "Empresa", en: "Company" },
  role: { pt: "Cargo", en: "Role" },
  period: { pt: "Período (Ex: 2022 - Atual)", en: "Period (e.g. 2022 - Present)" },
  descPlaceholder: { pt: "Descreva suas conquistas e responsabilidades...", en: "Describe your achievements and responsibilities..." },
  noExperience: { pt: 'Nenhuma experiência adicionada. Clique em "+ Adicionar" para começar.', en: 'No experience added. Click "+ Add" to begin.' },

  // Form - Education
  educationTitle: { pt: "Formação Acadêmica", en: "Education" },
  institution: { pt: "Instituição", en: "Institution" },
  course: { pt: "Curso", en: "Degree / Course" },
  date: { pt: "Data", en: "Date" },
  noEducation: { pt: "Nenhuma formação adicionada.", en: "No education added." },

  // Form - Custom
  customTag: { pt: "Extensão", en: "Extension" },
  removeModule: { pt: "Remover Módulo", en: "Remove Module" },
  newSection: { pt: "Nova Seção (ex: Idiomas, Projetos...)", en: "New Section (e.g. Languages, Projects...)" },
  attachModule: { pt: "Anexar Módulo", en: "Attach Module" },
  contentPlaceholder: { pt: "Conteúdo livre para", en: "Free content for" },

  // Shared
  add: { pt: "+ Adicionar", en: "+ Add" },
  removeExperience: { pt: "Remover experiência", en: "Remove experience" },
  removeEducation: { pt: "Remover formação", en: "Remove education" },

  // PDF sections
  pdfSummary: { pt: "Resumo Profissional", en: "Professional Summary" },
  pdfExperience: { pt: "Experiência Profissional", en: "Professional Experience" },
  pdfEducation: { pt: "Formação Acadêmica", en: "Education" },
  pdfSkills: { pt: "Habilidades", en: "Skills" },

  // BG Remover
  bgTitle: { pt: "Removedor de Fundo", en: "Background Remover" },
  bgSubtitle: { pt: "Remova o fundo de imagens localmente usando seu navegador", en: "Remove image backgrounds locally using your browser" },
  bgUploadTitle: { pt: "Clique ou arraste uma imagem", en: "Click or drag an image" },
  bgUploadHint: { pt: "Apenas arquivos de imagem (PNG, JPG, etc)", en: "Image files only (PNG, JPG, etc)" },
  bgYourImage: { pt: "Sua Imagem", en: "Your Image" },
  bgResult: { pt: "Resultado", en: "Result" },
  bgClear: { pt: "Limpar", en: "Clear" },
  bgRemove: { pt: "Remover Fundo", en: "Remove Background" },
  bgDownload: { pt: "Baixar", en: "Download" },
  bgOriginal: { pt: "Original", en: "Original" },
  bgRemoved: { pt: "Sem Fundo", en: "Removed" },
  bgDownloading: { pt: "Baixando modelo...", en: "Downloading model..." },
  bgProcessing: { pt: "Processando...", en: "Processing..." },
  bgError: { pt: "Erro", en: "Error" },
  bgInfo: { pt: "O processamento ocorre totalmente offline no seu navegador.", en: "Processing happens entirely offline in your browser." },
  bgBack: { pt: "Voltar para Aletheia", en: "Back to Aletheia" },
  bgQuality: { pt: "Qualidade do Modelo", en: "Model Quality" },
  bgFast: { pt: "Rapido (RMBG-1.4)", en: "Fast (RMBG-1.4)" },
  bgPrecise: { pt: "Preciso (RMBG-2.0)", en: "Precise (RMBG-2.0)" },
  bgPreciseHint: { pt: "O modelo 2.0 e mais pesado mas entrega recortes melhores.", en: "The 2.0 model is heavier but delivers better cutouts." },
  bgFastHint: { pt: "O modelo 1.4 e mais rapido e usa menos memoria.", en: "The 1.4 model is faster and uses less memory." },
  bgProcessFailed: { pt: "Falha ao processar a imagem.", en: "Failed to process image." },
} as const;

export function t(key: keyof typeof labels, lang: Lang): string {
  return labels[key][lang];
}

export function dispatchLangChange(lang: Lang) {
  window.dispatchEvent(new CustomEvent("aletheia-lang-change", { detail: { lang } }));
}
