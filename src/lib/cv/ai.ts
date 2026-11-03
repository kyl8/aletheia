import type { ResumeData } from './types.ts';
import { normalizeResumeData } from './parser.ts';

type Progress={status:string;progress?:number;message?:string};
export class LocalCvAI {
  private worker:Worker|null=null;
  private request=0;
  async run(text:string,onProgress:(event:Progress)=>void):Promise<ResumeData> {
    this.cancel();
    const job=++this.request;
    const worker=new Worker(new URL('../../workers/cv-ai.worker.ts',import.meta.url),{type:'module'});
    this.worker=worker;
    return new Promise((resolve,reject)=>{
      worker.onmessage=(event:MessageEvent)=>{
        if(job!==this.request)return;
        const data=event.data;
        if(data.status==='complete'){
          this.cancel();
          resolve(normalizeResumeData(data.data));
        }else if(data.status==='error'){
          this.cancel();reject(new Error(String(data.message||'Erro no modelo de IA')));
        }else onProgress(data as Progress);
      };
      worker.onerror=()=>{this.cancel();reject(new Error('Não foi possível executar IA neste navegador.'))};
      worker.postMessage({rawText:text.slice(0,16_000)});
    });
  }
  cancel(){this.request++;this.worker?.terminate();this.worker=null;}
}
