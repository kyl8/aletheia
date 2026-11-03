import { useState, useEffect } from "react";
import CVMain from "./cv/main";
import BgRemoverMain from "./bgremover/main";
import { type Lang } from "../utils/i18n";
import { Image, FileText } from "lucide-react";

export default function AletheiaApp() {
  const [activeTab, setActiveTab] = useState<"cv" | "bg">("cv");
  const [lang, setLang] = useState<Lang>("pt");

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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-center flex-wrap gap-2 md:gap-4 mb-4 md:mb-8">
        <button
          onClick={() => setActiveTab("cv")}
          className={`flex items-center px-4 py-3 border-4 pixel-box font-press-start text-xs uppercase tracking-wider transition-all
            ${activeTab === "cv" 
              ? "bg-indigo-500 text-white border-indigo-700" 
              : "bg-white text-zinc-900 border-zinc-900 border-solid hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"}`}
        >
          <FileText className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Aletheia CV</span>
          <span className="sm:hidden">CV</span>
        </button>
        <button
          onClick={() => setActiveTab("bg")}
          className={`flex items-center px-4 py-3 border-4 pixel-box font-press-start text-xs uppercase tracking-wider transition-all
            ${activeTab === "bg" 
              ? "bg-emerald-500 text-zinc-900 border-emerald-700 border-solid" 
              : "bg-white text-zinc-900 border-zinc-900 border-solid hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"}`}
        >
          <Image className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">BG Remover</span>
          <span className="sm:hidden">BG</span>
        </button>
      </div>

      <div className="mt-8 relative">
        <div style={{ display: activeTab === "cv" ? "block" : "none" }}>
          <CVMain />
        </div>
        {activeTab === "bg" && <BgRemoverMain lang={lang} onBack={() => setActiveTab("cv")} />}
      </div>
    </div>
  );
}
