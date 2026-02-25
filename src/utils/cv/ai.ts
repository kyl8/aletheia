import {t} from "../i18n";


//TODO: TRADUZIR ISSO DAQUI
export const processResumeWithAI = (
  rawText: string,
  engine: "webgpu" | "wasm",
  model: string,
  onProgress: (progress: number, text: string, status?: string, token?: string) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('../worker/ai.worker.ts', import.meta.url), 
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        const data = e.data;
        const status = data.status;
        if (status === 'initiate') {
          onProgress(0, `Preparando download: ${data.file || 'modelo'}...`, 'progress');
        } 
        else if (status === 'progress') {
          const prog = data.progress || (data.info && data.info.progress) || 0;
          const file = data.file || (data.info && data.info.file) || 'ficheiros';
          onProgress(prog / 100, `Transferindo ${file}: ${Math.round(prog)}%`, 'progress');
        } 
        else if (status === 'done') {
          onProgress(1, `Download do modelo ${data.file || 'modelo'} concluído.`, 'progress');
        } 
        else if (status === 'ready') {
          onProgress(1, `LLM iniciada com sucesso!`, 'progress');
        } 
        else if (status === 'thinking' || status === 'update') {
          const token = data.token || data.output || "";
          onProgress(1, "Processando documento...", 'thinking', token);
        } 
        else if (status === 'complete') {
          resolve(data.data || data.output || data.result);
          worker.terminate();
        } 
        else if (status === 'error') {
          reject(new Error(data.error || "Falha crítica no processamento."));
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error("Erro fatal no Worker:", err);
        reject(new Error("Falha na execução do Web Worker. Verifique o console (F12)."));
        worker.terminate();
      };

      worker.postMessage({ text: rawText, device: engine, model });
      
    } catch (error: any) {
      reject(new Error(`Erro ao invocar o motor de IA: ${error.message}`));
    }
  });
};