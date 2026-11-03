export function loadImage(url:string):Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('Não foi possível carregar a imagem.'));
    image.src=url;
  });
}
export async function composeResult(imageUrl:string,maskUrl:string):Promise<Blob> {
  const [src,mask]=await Promise.all([loadImage(imageUrl),loadImage(maskUrl)]);
  const canvas=document.createElement('canvas');canvas.width=src.naturalWidth;canvas.height=src.naturalHeight;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Canvas indisponível.');
  ctx.drawImage(src,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  const maskCanvas=document.createElement('canvas');maskCanvas.width=canvas.width;maskCanvas.height=canvas.height;
  const mctx=maskCanvas.getContext('2d',{willReadFrequently:true});if(!mctx)throw new Error('Canvas indisponível.');
  mctx.drawImage(mask,0,0,maskCanvas.width,maskCanvas.height);
  const maskPixels=mctx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
  // Most RMBG segmentation masks are grayscale; use first channel rather than transparent alpha.
  // Some encoders emit alpha masks, which are handled when alpha varies across pixels.
  let alphaVaries=false;
  for(let i=3;i<maskPixels.length;i+=Math.max(4,Math.floor(maskPixels.length/4096/4)*4)){
    if(maskPixels[i]<250){alphaVaries=true;break;}
  }
  for(let i=0;i<pixels.data.length;i+=4){
    const m=alphaVaries?maskPixels[i+3]:Math.round((maskPixels[i]+maskPixels[i+1]+maskPixels[i+2])/3);
    pixels.data[i+3]=Math.round(pixels.data[i+3]*m/255);
  }
  ctx.putImageData(pixels,0,0);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('Falha ao exportar PNG.');
  return blob;
}
