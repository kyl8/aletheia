import {t} from "../i18n";

let cachedWorker: Worker | null = null;
let currentResolve: ((value: any) => void) | null = null;
let currentReject: ((reason?: any) => void) | null = null;
let currentOnProgress: ((progress: number, text: string, status?: string, token?: string) => void) | null = null;

//TODO: TRADUZIR ISSO DAQUI
export const processResumeWithAI = (
  rawText: string,
  engine: "webgpu" | "wasm",
  model: string,
  onProgress: (progress: number, text: string, status?: string, token?: string) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      if (!cachedWorker) {
        cachedWorker = new Worker(
          new URL('../worker/ai.worker.ts', import.meta.url), 
          { type: 'module' }
        );

        cachedWorker.onmessage = (e) => {
          const data = e.data;
          const status = data.status;
          if (status === 'initiate') {
            currentOnProgress?.(0, `Preparando download: ${data.file || 'modelo'}...`, 'progress');
          } 
          else if (status === 'progress') {
            const prog = data.progress || (data.info && data.info.progress) || 0;
            const file = data.file || (data.info && data.info.file) || 'ficheiros';
            currentOnProgress?.(prog / 100, `Transferindo ${file}: ${Math.round(prog)}%`, 'progress');
          } 
          else if (status === 'done') {
            currentOnProgress?.(1, `Download do modelo ${data.file || 'modelo'} concluído.`, 'progress');
          } 
          else if (status === 'ready') {
            currentOnProgress?.(1, `LLM iniciada com sucesso!`, 'progress');
          } 
          else if (status === 'thinking' || status === 'update') {
            const token = data.token || data.output || "";
            currentOnProgress?.(1, "Processando documento...", 'thinking', token);
          } 
          else if (status === 'complete') {
            currentResolve?.(data.data || data.output || data.result);
          } 
          else if (status === 'error') {
            currentReject?.(new Error(data.error || "Falha crítica no processamento."));
          }
        };

        cachedWorker.onerror = (err) => {
          console.error("Erro fatal no Worker:", err);
          currentReject?.(new Error("Falha na execução do Web Worker. Verifique o console (F12)."));
        };
      }

      currentResolve = resolve;
      currentReject = reject;
      currentOnProgress = onProgress;

      cachedWorker.postMessage({ text: rawText, device: engine, model });
      
    } catch (error: any) {
      reject(new Error(`Erro ao invocar o motor de IA: ${error.message}`));
    }
  });
};