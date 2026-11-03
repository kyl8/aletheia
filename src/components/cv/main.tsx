import { useState, useEffect, useCallback, useRef } from "react";
import { emptyResumeData, parseResumeText, type ResumeData } from "../../utils/cv/parser";
import { extractTextFromPdf, extractTextFromDocx } from "../../utils/cv/extractor";
import { processResumeWithAI } from "../../utils/cv/ai";

import FileIngestion from "./up";
import ResumeForm from "./form";
import AiEnginePanel from "./ai";
import AlertModal from "./alert";
import PdfViewer from "../utils/pdfviewer"; 

import { RotateCcw, Download, Loader2, ChevronDown, FileText, Eye, Globe } from "lucide-react";
import { t, type Lang } from "../../utils/i18n";

type Step = "upload" | "editing";

export default function AletheiaController() {
  const [step, setStep] = useState<Step>("upload");
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResumeData());
  const [lang, setLang] = useState<Lang>("pt");
  const [isManual, setIsManual] = useState(false);

  // Controle de Modais
  const [showResetModal, setShowResetModal] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Estados da IA
  const [hardwareType, setHardwareType] = useState<"webgpu" | "wasm">("webgpu");
  const [selectedModel, setSelectedModel] = useState("onnx-community/Qwen2.5-0.5B-Instruct");
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiThought, setAiThought] = useState("");
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => { 
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false); 
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const syncLang = () => {
      const savedLang = localStorage.getItem("aletheia_lang") as Lang;
      if (savedLang) setLang(savedLang);
    };

    syncLang();

    window.addEventListener("aletheia-lang-change", syncLang);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "aletheia_lang") syncLang();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("aletheia-lang-change", syncLang);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Persistência de Rascunho
  useEffect(() => {
    const saved = localStorage.getItem("aletheia_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setResumeData({ ...emptyResumeData(), ...parsed });
        setStep("editing");
      } catch { localStorage.removeItem("aletheia_draft"); }
    }
  }, []);

  useEffect(() => {
    if (step === "editing") {
      localStorage.setItem("aletheia_draft", JSON.stringify(resumeData));
    }
  }, [resumeData, step]);

  const handleFile = useCallback(async (file: File) => {
    setIsManual(false);
    try {
      const text = await (file.name.toLowerCase().endsWith(".pdf") ? extractTextFromPdf(file) : 
                        file.name.toLowerCase().endsWith(".docx") ? extractTextFromDocx(file) : file.text());
      setRawText(text);
      setResumeData({ ...emptyResumeData(), ...parseResumeText(text) });
      setStep("editing");
    } catch (err) { console.error(err); }
  }, []);

  const runAI = useCallback(async () => {
    if (!rawText && !resumeData.nome) return;
    setAiStatus("loading");
    try {
      const result = await processResumeWithAI(rawText || JSON.stringify(resumeData), hardwareType, selectedModel, (p, text, status, token) => {
        setAiProgress(Math.round(p * 100));
        if (status === "thinking") setAiThought(prev => prev + (token || ""));
        else if (text) setAiLogs(prev => [...prev, `> ${text}`].slice(-20));
      });
      if (result) setResumeData(prev => ({ ...prev, ...result }));
    } catch (err: any) { setAiLogs(prev => [...prev, `[ERR] ${err.message}`]); }
    finally { setAiStatus("idle"); }
  }, [rawText, resumeData, hardwareType, selectedModel]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 relative">
      
      <AlertModal 
        isOpen={showResetModal}
        title="Aviso Crítico"
        message={t("resetConfirm", lang)}
        confirmText="Apagar"
        cancelText="Cancelar"
        onConfirm={() => { localStorage.clear(); window.location.reload(); }}
        onCancel={() => setShowResetModal(false)}
      />

      <PdfViewer 
        isOpen={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        data={resumeData} 
        lang={lang} 
      />

      {step === "upload" ? (
        <FileIngestion onFile={handleFile} onNew={() => { setIsManual(true); setStep("editing"); }} lang={lang} />
      ) : (
        <div className="space-y-10 animate-in fade-in">
          
          <header className="sticky top-6 z-40 flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-100 dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-200 pixel-box shadow-[6px_6px_0px_0px_#18181b]">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowResetModal(true)} className="font-silkscreen text-xs uppercase flex items-center gap-2 hover:text-red-500 transition-colors">
                <RotateCcw size={16} /> {t("reset", lang)}
              </button>
              
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setPreviewOpen(true)} 
                className="bg-indigo-600 text-white font-silkscreen text-xs uppercase px-4 py-3 border-4 border-zinc-900 pixel-box flex items-center gap-2 hover:bg-indigo-500 active:translate-y-1"
              >
                <Eye size={16} /> Preview PDF
              </button>

              <div className="relative" ref={exportRef}>
                <button 
                  onClick={() => setExportOpen(!exportOpen)} 
                  className="bg-emerald-500 text-zinc-900 font-silkscreen text-xs uppercase px-4 py-3 border-4 border-zinc-900 pixel-box flex items-center gap-2 hover:bg-emerald-400 active:translate-y-1"
                >
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Exportar
                </button>
                
                {exportOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border-4 border-zinc-900 z-50 shadow-[6px_6px_0px_0px_#000]">
                    <button 
                      onClick={async () => { 
                        setExportOpen(false); 
                        const { downloadTypst } = await import("../../utils/cv/typst"); 
                        downloadTypst(resumeData, lang); 
                      }} 
                      className="w-full flex items-center gap-3 px-4 py-4 font-silkscreen text-xs uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <FileText size={16} className="text-red-500" /> Baixar .TYP
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {!isManual && (
            <AiEnginePanel 
              hardwareType={hardwareType} setHardwareType={setHardwareType} 
              selectedModel={selectedModel} setSelectedModel={setSelectedModel}
              status={aiStatus} progress={aiProgress} thoughtStream={aiThought} logs={aiLogs} 
              onStartInference={runAI} lang={lang} 
            />
          )}

          <ResumeForm data={resumeData} setData={setResumeData} lang={lang} />
        </div>
      )}
    </div>
  );
}