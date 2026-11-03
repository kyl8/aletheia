/**
 * Single-thread FFmpeg WASM. No cross-origin isolation headers needed on GitHub Pages.
 * Core is fetched on first use from jsDelivr; the user's media stays in the browser.
 * Never copy VERT's AGPL source into this project.
 */
export type MediaOutput = 'mp3'|'wav'|'ogg'|'m4a'|'mp4'|'webm'|'gif';
export class MediaConverter {
  private ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg|null=null;
  private started=false;
  private progressCb:((percent:number,message:string)=>void)|null=null;
  async convert(file:File,target:MediaOutput,onProgress:(percent:number,message:string)=>void):Promise<Blob>{
    if(file.size>60*1024*1024)throw new Error('Máximo de 60 MB. Converta arquivos maiores no VERT ou FFmpeg desktop.');
    const {FFmpeg}=await import('@ffmpeg/ffmpeg');
    const {fetchFile,toBlobURL}=await import('@ffmpeg/util');
    if(!this.ffmpeg){
      this.ffmpeg=new FFmpeg();
      this.ffmpeg.on('progress',({progress})=>this.progressCb?.(Math.max(0,Math.min(100,Math.round(progress*100))),'Convertendo mídia...'));
    }
    this.progressCb=onProgress;
    const ffmpeg=this.ffmpeg;
    if(!this.started){
      onProgress(0,'Baixando FFmpeg WASM (~31 MB). Apenas na primeira execução.');
      const baseURL='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
      await ffmpeg.load({
        coreURL:await toBlobURL(`${baseURL}/ffmpeg-core.js`,'text/javascript'),
        wasmURL:await toBlobURL(`${baseURL}/ffmpeg-core.wasm`,'application/wasm'),
      });
      this.started=true;
    }
    const ext=file.name.match(/\.([a-z0-9]{2,6})$/i)?.[1]?.toLowerCase()||'bin';
    const input=`input.${ext}`;
    const output=`output.${target}`;
    const args:Record<MediaOutput,string[]>={
      mp3:['-i',input,'-vn','-c:a','libmp3lame','-q:a','4',output],
      wav:['-i',input,'-vn','-c:a','pcm_s16le',output],
      ogg:['-i',input,'-vn','-c:a','libvorbis','-q:a','4',output],
      m4a:['-i',input,'-vn','-c:a','aac','-b:a','160k',output],
      mp4:['-i',input,'-c:v','libx264','-preset','ultrafast','-crf','28','-c:a','aac',output],
      webm:['-i',input,'-c:v','libvpx','-b:v','900k','-c:a','libopus',output],
      gif:['-i',input,'-t','8','-vf','fps=8,scale=480:-1:flags=lanczos',output],
    };
    try{
      onProgress(0,'Carregando arquivo na memória...');
      await ffmpeg.writeFile(input,await fetchFile(file));
      const exitCode=await ffmpeg.exec(['-y',...args[target]],120_000);
      if(exitCode!==0)throw new Error('FFmpeg não conseguiu converter este formato/codec. Tente outro formato ou arquivo menor.');
      const data=await ffmpeg.readFile(output);
      if(typeof data==='string')throw new Error('FFmpeg retornou uma saída inválida.');
      const buffer=new ArrayBuffer(data.byteLength);new Uint8Array(buffer).set(data);
      onProgress(100,'Conversão concluída.');
      const mime:Record<MediaOutput,string>={mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4',mp4:'video/mp4',webm:'video/webm',gif:'image/gif'};
      return new Blob([buffer],{type:mime[target]});
    }finally{
      try{await ffmpeg.deleteFile(input);}catch{}
      try{await ffmpeg.deleteFile(output);}catch{}
    }
  }
  terminate(){this.ffmpeg?.terminate();this.ffmpeg=null;this.started=false;this.progressCb=null;}
}
