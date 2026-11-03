import { pipeline, env } from '@huggingface/transformers';
env.allowLocalModels=false;
env.useBrowserCache=true;
let runner:((data:string)=>Promise<any>)|null=null;
const report=(data:unknown)=>self.postMessage(data);
self.onmessage=async(event:MessageEvent<{image:string}>)=>{
  try {
    if(!runner){
      const options={
        dtype:'fp32' as const,
        progress_callback:(v:{status?:string;progress?:number;file?:string})=>{
          if(v.status==='progress') report({status:'loading',progress:Math.round(v.progress??0),message:v.file??'Baixando modelo'});
        }
      };
      report({status:'loading',message:'Baixando modelo de remoção local (primeira utilização).'});
      try {
        runner=await pipeline('image-segmentation','briaai/RMBG-1.4',{...options,device:'webgpu'}) as unknown as (data: string) => Promise<any[]>;
      } catch {
        report({status:'loading',message:'Utilizando execução WASM.'});
        runner=await pipeline('image-segmentation','briaai/RMBG-1.4',{...options,device:'wasm'}) as unknown as (data: string) => Promise<any[]>;
      }
    }
    report({status:'processing',message:'Calculando máscara de recorte...'});
    const result=await runner!(event.data.image);
    const mask=result?.[0]?.mask;
    if(!mask) throw new Error('O modelo não retornou uma máscara.');
    if(typeof mask.toDataURL==='function') report({status:'complete',mask:mask.toDataURL()});
    else if(typeof mask==='string') report({status:'complete',mask});
    else throw new Error('Máscara de recorte em formato não suportado.');
  }catch(error){report({status:'error',message:error instanceof Error?error.message:'Erro no removedor'});}
};
