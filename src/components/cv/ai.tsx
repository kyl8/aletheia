import { Play, Loader2, BrainCircuit, ChevronDown, Terminal } from "lucide-react";
import { t, type Lang } from "../../utils/i18n";

interface AiEnginePanelProps {
  hardwareType: "webgpu" | "wasm"; setHardwareType: (type: "webgpu" | "wasm") => void;
  selectedModel: string; setSelectedModel: (model: string) => void;
  status: string; progress: number; thoughtStream: string; logs: string[];
  onStartInference: () => void; lang: Lang;
}

const AVAILABLE_MODELS = [
  { id: "onnx-community/Qwen2.5-0.5B-Instruct", name: "Qwen 0.5", detail: "0.5B" },
  { id: "onnx-community/Llama-3.2-1B-Instruct", name: "Llama 3.2", detail: "1B" },
  { id: "onnx-community/Phi-3.5-mini-instruct", name: "Phi 3.5", detail: "mini" }
];

export default function AiEnginePanel({ hardwareType, setHardwareType, selectedModel, setSelectedModel, status, progress, thoughtStream, logs, onStartInference, lang }: AiEnginePanelProps) {
  const isRunning = status === "loading";

  return (
    <div className="w-full bg-indigo-50 dark:bg-zinc-900 p-8 pixel-box border-4 border-zinc-900 dark:border-zinc-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b-4 border-zinc-900 dark:border-zinc-200 pb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 border-4 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}>
            <BrainCircuit size={32} strokeWidth={3} className={isRunning ? "animate-pulse text-emerald-500" : ""} />
          </div>
          <div>
            <h2 className="font-silkscreen text-xl text-zinc-900 dark:text-white uppercase flex items-center gap-3">
              {t("aiTitle", lang)} {isRunning && <span className="w-3 h-3 bg-emerald-500 border-2 border-zinc-900 animate-ping" />}
            </h2>
            <span className="font-dotgothic text-sm text-indigo-600 dark:text-indigo-400">SYS_OVERRIDE_ENABLED</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={isRunning} className="w-full appearance-none bg-white dark:bg-zinc-950 border-4 border-zinc-900 dark:border-zinc-200 px-4 py-3 font-vt323 text-xl text-zinc-900 dark:text-zinc-100 outline-none pr-10 cursor-pointer disabled:opacity-50">
              {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name} [{m.detail}]</option>)}
            </select>
            <ChevronDown size={20} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-900 dark:text-zinc-100 pointer-events-none" />
          </div>

          <div className="flex bg-white dark:bg-zinc-950 border-4 border-zinc-900 dark:border-zinc-200">
            {(["webgpu", "wasm"] as const).map((hw) => (
              <button key={hw} onClick={() => setHardwareType(hw)} disabled={isRunning} className={`px-4 py-3 font-silkscreen text-xs uppercase transition-colors ${ hardwareType === hw ? "bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
                {hw}
              </button>
            ))}
          </div>

          <button onClick={onStartInference} disabled={isRunning} className="flex items-center justify-center gap-3 px-6 py-3 font-silkscreen text-xs uppercase bg-emerald-500 text-zinc-900 pixel-box hover:bg-emerald-400 disabled:opacity-50">
            {isRunning ? <Loader2 size={16} strokeWidth={3} className="animate-spin" /> : <Play size={16} fill="currentColor" />} {isRunning ? "..." : t("aiExec", lang)}
          </button>
        </div>
      </div>

      <div className="bg-zinc-950 border-4 border-zinc-900 dark:border-zinc-200 overflow-hidden relative shadow-[8px_8px_0px_0px_#18181b] dark:shadow-[8px_8px_0px_0px_#e4e4e7]">
        <div className="flex items-center px-4 py-3 border-b-4 border-zinc-900 dark:border-zinc-800 bg-zinc-900">
          <span className="font-silkscreen text-xs text-zinc-400 uppercase flex items-center gap-3">
            <Terminal size={14} strokeWidth={3} /> COM_LINK_ACTIVE
          </span>
        </div>
        <div className="p-6 h-48 overflow-y-auto font-vt323 text-2xl leading-relaxed bg-black custom-scrollbar">
          {thoughtStream ? (
            <div className="text-emerald-400 animate-in fade-in">{thoughtStream}</div>
          ) : (
            logs.map((l, i) => (
              <div key={i} className={`flex gap-4 ${l.startsWith("[ERR]") ? "text-red-500" : "text-zinc-300"}`}>
                <span className="text-zinc-700 select-none w-6 text-right">{i + 1}</span> <span>{l}</span>
              </div>
            ))
          )}
        </div>
        <div className="h-2 bg-zinc-900 border-t-4 border-zinc-800">
          <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}