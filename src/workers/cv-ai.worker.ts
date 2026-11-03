import {pipeline,env} from '@huggingface/transformers';
env.allowLocalModels=false;
env.useBrowserCache=true;
const send=(message:unknown)=>self.postMessage(message);
let pipe: any=null;
self.onmessage=async(event:MessageEvent<{rawText:string}>)=>{
  try{
    const text=event.data.rawText;
    if(!text?.trim()) throw new Error('Sem texto para analisar.');
    send({status:'preparing',message:'Preparando o modelo local. O download inicial pode ser grande.'});
    const gpu=typeof navigator!=='undefined' && 'gpu' in navigator;
    const model='onnx-community/Qwen2.5-0.5B-Instruct';
    if(!pipe){
      const progress=(x:{status?:string;progress?:number;file?:string})=>{
        if(x.status==='progress')send({status:'loading',progress:Math.round(x.progress||0),message:x.file||'Baixando modelo'});
      };
      try{pipe=await pipeline('text-generation',model,{device:gpu?'webgpu':'wasm',dtype:'q4',progress_callback:progress});}
      catch(error){
        if(!gpu)throw error;
        send({status:'loading',message:'WebGPU indisponível. Tentando WASM...'});
        pipe=await pipeline('text-generation',model,{device:'wasm',dtype:'q4',progress_callback:progress});
      }
    }
    send({status:'processing',message:'Extraindo informações do currículo...'});
    const instructions=`Leia o currículo e devolva somente JSON válido, sem markdown e sem comentários. Não invente informações. Campos ausentes devem ser strings vazias ou arrays vazios. Esquema: {"nome":"","email":"","telefone":"","localizacao":"","links":"","resumo":"","experiencias":[{"cargo":"","empresa":"","periodo":"","local":"","tipo":"","descricao":""}],"formacao":[{"curso":"","instituicao":"","periodo":"","descricao":""}],"habilidades":[{"categoria":"","itens":""}],"secoes":[{"titulo":"","conteudo":""}]}. Para experiências, descreva realizações sem inventar números. Dados: ${text}`;
    const results=await (pipe as any)([
      {role:'system',content:'Você extrai dados de currículos para JSON válido, sem inventar fatos.'},
      {role:'user',content:instructions}
    ],{max_new_tokens:2200,do_sample:false,return_full_text:false});
    const generated=results?.[0]?.generated_text;
    const output=typeof generated==='string'?generated:Array.isArray(generated)?generated.at(-1)?.content??'':String(generated??'');
    const a=output.indexOf('{'),b=output.lastIndexOf('}');
    if(a<0||b<a) throw new Error('A IA não retornou JSON válido. Você pode continuar com o parser local.');
    let parsed:unknown;
    try{parsed=JSON.parse(output.slice(a,b+1));}catch{throw new Error('A IA retornou JSON inválido. Revise a extração manual.');}
    send({status:'complete',data:parsed});
  }catch(e){send({status:'error',message:e instanceof Error?e.message:'Erro inesperado na IA'});}
};
