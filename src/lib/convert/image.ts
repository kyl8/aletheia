import {zipSync} from 'fflate';
export type ImageFormat='image/png'|'image/jpeg'|'image/webp';
export interface Converted {name:string;blob:Blob;}
export async function imageToBlob(file:File,format:ImageFormat,quality:number,scale:number,background='#ffffff'):Promise<Converted> {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error(`Formato de entrada não suportado: ${file.name}`);
  if(file.size>20*1024*1024)throw new Error('Imagem maior que 20 MB.');
  const objectUrl=URL.createObjectURL(file);
  try{
    const img=await new Promise<HTMLImageElement>((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Imagem não pode ser lida.'));i.src=objectUrl;});
    const width=Math.max(1,Math.round(img.naturalWidth*scale));
    const height=Math.max(1,Math.round(img.naturalHeight*scale));
    if(width*height>25_000_000)throw new Error('Imagem excede 25 megapixels após redimensionamento.');
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas indisponível.');
    if(format==='image/jpeg'){ctx.fillStyle=background;ctx.fillRect(0,0,width,height);}
    ctx.drawImage(img,0,0,width,height);
    const blob=await new Promise<Blob|null>(res=>canvas.toBlob(res,format,Math.min(1,Math.max(.1,quality))));
    if(!blob)throw new Error('Falha ao criar arquivo convertido.');
    if(blob.type!==format)throw new Error(`Este navegador não oferece exportação ${format}.`);
    const ext=format==='image/jpeg'?'jpg':format.split('/')[1];
    return {name:`${file.name.replace(/\.[^.]+$/,'')}.${ext}`,blob};
  }finally{URL.revokeObjectURL(objectUrl);}
}
export async function imagesToZip(files:Converted[]):Promise<Blob> {
  if(files.length>100)throw new Error('Máximo de 100 imagens por ZIP.');
  const entries:Record<string,Uint8Array>={};
  for(const [i,file] of files.entries()){
    const buf=await file.blob.arrayBuffer();entries[`${String(i+1).padStart(2,'0')}-${file.name}`]=new Uint8Array(buf);
  }
  const zipped=zipSync(entries,{level:0});
  const bytes=new ArrayBuffer(zipped.byteLength);
  new Uint8Array(bytes).set(zipped);
  return new Blob([bytes],{type:'application/zip'});
}
