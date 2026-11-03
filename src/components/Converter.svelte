<script lang="ts">
  import {imageToBlob,imagesToZip,type ImageFormat,type Converted} from '../lib/convert/image.ts';
  import {csvToJson,jsonToCsv} from '../lib/convert/data.ts';
  import {extractText} from '../lib/cv/extract.ts';
  import {MediaConverter,type MediaOutput} from '../lib/convert/media.ts';
  import {compileTypstSource,escapeTypst,saveBlob} from '../lib/cv/typst.ts';
  let tab=$state<'images'|'documents'|'data'|'media'>('images');
  let images=$state<File[]>([]);
  let resultImages=$state<Converted[]>([]);
  let imageType=$state<ImageFormat>('image/webp');
  let quality=$state(82);
  let scale=$state(1);
  let background=$state('#ffffff');
  let docFile=$state<File|null>(null);
  let docOutput=$state<'txt'|'pdf'>('txt');
  let dataFile=$state<File|null>(null);
  let dataDirection=$state<'csv-json'|'json-csv'>('csv-json');
  let mediaFile=$state<File|null>(null);
  let mediaOutput=$state<MediaOutput>('mp3');
  const mediaEngine=new MediaConverter();
  let running=$state(false);
  let progress=$state(0);
  let status=$state('');
  let error=$state('');
  const selectImages=(e:Event)=>{const input=e.currentTarget as HTMLInputElement;images=Array.from(input.files||[]).slice(0,100);resultImages=[];status='';error='';input.value='';};
  const selectDoc=(e:Event)=>{const input=e.currentTarget as HTMLInputElement;docFile=input.files?.[0]||null;status='';error='';input.value='';};
  const selectMedia=(e:Event)=>{const input=e.currentTarget as HTMLInputElement;mediaFile=input.files?.[0]||null;resetMessages();input.value='';};
  const selectData=(e:Event)=>{const input=e.currentTarget as HTMLInputElement;dataFile=input.files?.[0]||null;status='';error='';input.value='';};
  const message=(e:unknown)=>e instanceof Error?e.message:String(e);
  function resetMessages(){error='';status='';progress=0;}
  async function convertImages(){
    if(!images.length)return;
    running=true;resetMessages();resultImages=[];
    try{
      for(const file of images){
        const converted=await imageToBlob(file,imageType,quality/100,scale,background);
        resultImages.push(converted);
        progress=Math.round(resultImages.length/images.length*100);
        status=`${resultImages.length}/${images.length} imagens convertidas`;
        await new Promise<void>(resolve=>setTimeout(resolve,0));
      }
    }catch(e){error=message(e);}finally{running=false;}
  }
  async function saveAll(){
    if(!resultImages.length)return;
    try{if(resultImages.length===1)saveBlob(resultImages[0].blob,resultImages[0].name);
    else saveBlob(await imagesToZip(resultImages),'aletheia-imagens.zip');}
    catch(e){error=message(e);}
  }
  async function convertDoc(){
    if(!docFile)return;
    resetMessages();running=true;
    try{
      const text=await extractText(docFile);
      if(docOutput==='txt')saveBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),`${docFile.name.replace(/\.[^.]+$/,'')}.txt`);
      else {
        if(text.length>150_000)throw new Error('Documento muito extenso para geração rápida de PDF.');
        const lines=text.replace(/\r\n?/g,'\n').split('\n').map(line=>escapeTypst(line));
        const source=`#set page(paper:"a4",margin:2cm)\n#set text(size:10pt)\n#set par(leading:0.65em)\n${lines.join('\n')}`;
        saveBlob(await compileTypstSource(source),`${docFile.name.replace(/\.[^.]+$/,'')}.pdf`);
      }
      status='Documento convertido. Para DOCX com layout complexo, o TXT/PDF de texto não preserva formatação.';
    }catch(e){error=message(e);}finally{running=false;}
  }
  async function convertMedia(){
    if(!mediaFile)return;resetMessages();running=true;
    try{
      const blob=await mediaEngine.convert(mediaFile,mediaOutput,(value,text)=>{progress=value;status=text;});
      saveBlob(blob,`${mediaFile.name.replace(/\.[^.]+$/,'')}.${mediaOutput}`);
      status='Conversão concluída e arquivo disponibilizado.';
    }catch(e){error=message(e);}finally{running=false;}
  }
  function cancelMedia(){mediaEngine.terminate();running=false;status='Conversão interrompida.';}
  async function convertData(){
    if(!dataFile)return;resetMessages();running=true;
    try{
      if(dataFile.size>8*1024*1024)throw new Error('Arquivo de dados maior que 8 MB.');
      const input=await dataFile.text();
      const output=dataDirection==='csv-json'?JSON.stringify(csvToJson(input),null,2):jsonToCsv(input);
      const ext=dataDirection==='csv-json'?'json':'csv';
      const mime=ext==='json'?'application/json':'text/csv;charset=utf-8';
      saveBlob(new Blob([output],{type:mime}),`${dataFile.name.replace(/\.[^.]+$/,'')}.${ext}`);
      status='Arquivo de dados convertido.';
    }catch(e){error=message(e);}finally{running=false;}
  }
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">
  <div class="mb-8"><p class="font-['Silkscreen'] text-xs text-violet-600 dark:text-violet-300 mb-3">ALETHEIA / CONVERSÃO</p><h1 class="font-['Silkscreen'] text-2xl sm:text-3xl mb-3">Conversor local</h1><p class="muted max-w-3xl">Inspirado na proposta de privacidade do VERT. Converta imagens, documentos, dados e mídia no navegador, com FFmpeg WASM para áudio/vídeo, sem copiar o motor do VERT.</p></div>
  <div class="flex flex-wrap gap-3 mb-7" role="tablist" aria-label="Categorias de conversão">
    {#each [{id:'images',title:'IMAGENS'},{id:'documents',title:'DOCUMENTOS'},{id:'data',title:'CSV / JSON'},{id:'media',title:'ÁUDIO / VÍDEO'}] as item}
      <button role="tab" aria-selected={tab===item.id} class={`pixel-button px-4 py-3 ${tab===item.id?'bg-violet-600 text-white':'bg-[var(--panel)]'}`} onclick={()=>{tab=item.id as typeof tab;resetMessages();}}>{item.title}</button>
    {/each}
  </div>
  <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(240px,.45fr)] gap-6 items-start">
    <section class="pixel p-5 sm:p-7">
      {#if tab==='images'}
        <h2 class="section-heading mb-4">CONVERTER IMAGENS EM LOTE</h2>
        <p class="muted text-sm mb-4">Aceita PNG, JPEG e WebP. Transparência é substituída pela cor selecionada ao exportar JPEG.</p>
        <label class="label" for="converter-images">Arquivos de imagem (até 100)</label>
        <input class="field mb-5" id="converter-images" type="file" accept=".png,.jpg,.jpeg,.webp" multiple onchange={selectImages} />
        <div class="grid sm:grid-cols-2 gap-4 mb-5">
          <div><label class="label" for="img-format">Formato de saída</label><select class="field" id="img-format" bind:value={imageType}><option value="image/webp">WebP</option><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></div>
          <div><label class="label" for="img-scale">Tamanho</label><select class="field" id="img-scale" bind:value={scale}><option value={0.5}>50%</option><option value={1}>100%</option><option value={1.5}>150%</option><option value={2}>200%</option></select></div>
          <div><label class="label" for="img-quality">Qualidade · {quality}%</label><input class="w-full accent-violet-600" id="img-quality" type="range" min="10" max="100" bind:value={quality} disabled={imageType==='image/png'}/></div>
          {#if imageType==='image/jpeg'}<div><label class="label" for="img-bg">Cor de fundo</label><input class="field h-12" id="img-bg" type="color" bind:value={background}/></div>{/if}
        </div>
        <p class="text-sm muted mb-5">{images.length?`${images.length} arquivo(s) selecionado(s)`: 'Nenhum arquivo selecionado'}</p>
        {#if images.length}<ul class="text-sm space-y-1 max-h-40 overflow-y-auto mb-5">{#each images as f,i}<li>{i+1}. {f.name}</li>{/each}</ul>{/if}
        <div class="flex flex-wrap gap-3"><button class="pixel-button px-4 py-3 bg-violet-600 text-white" disabled={running||!images.length} onclick={convertImages}>CONVERTER</button><button class="pixel-button px-4 py-3 bg-emerald-500 text-zinc-950" disabled={!resultImages.length||running} onclick={saveAll}>{resultImages.length>1?'BAIXAR ZIP':'BAIXAR ARQUIVO'}</button></div>
      {:else if tab==='documents'}
        <h2 class="section-heading mb-4">DOCUMENTO PARA TEXTO / PDF</h2>
        <p class="text-sm muted mb-4">Extrai texto de PDF ou DOCX, e converte TXT/MD/DOCX em PDF de texto simples. Não preserva imagens ou formatação original.</p>
        <label class="label" for="converter-doc">Arquivo</label><input class="field mb-4" id="converter-doc" type="file" accept=".pdf,.docx,.txt,.md" onchange={selectDoc} />
        <label class="label" for="converter-doc-to">Saída</label><select class="field mb-6" id="converter-doc-to" bind:value={docOutput}><option value="txt">TXT (texto extraído)</option><option value="pdf">PDF (texto simples)</option></select>
        <button class="pixel-button px-4 py-3 bg-violet-600 text-white" onclick={convertDoc} disabled={running||!docFile}>CONVERTER DOCUMENTO</button>
      {:else if tab==='data'}
        <h2 class="section-heading mb-4">CSV ⇄ JSON</h2>
        <p class="text-sm muted mb-4">Converte uma tabela CSV com cabeçalho para objetos JSON ou objetos JSON para CSV. Suporta campos entre aspas.</p>
        <label class="label" for="converter-direction">Conversão</label><select class="field mb-5" id="converter-direction" bind:value={dataDirection}><option value="csv-json">CSV → JSON</option><option value="json-csv">JSON → CSV</option></select>
        <label class="label" for="converter-data">Arquivo de entrada</label><input class="field mb-6" id="converter-data" type="file" accept={dataDirection==='csv-json'?'.csv,.txt':'.json'} onchange={selectData}/>
        <button class="pixel-button px-4 py-3 bg-violet-600 text-white" onclick={convertData} disabled={running||!dataFile}>CONVERTER DADOS</button>
      {:else}
        <h2 class="section-heading mb-4">FFMPEG WASM · LOCAL</h2>
        <p class="text-sm muted mb-4">Converta arquivos curtos de áudio ou vídeo. O motor FFmpeg (aprox. 31 MB) é baixado de uma CDN na primeira utilização; os seus arquivos não são enviados. Conclusão e compatibilidade dependem do navegador, memória e codec.</p>
        <label class="label" for="converter-media">Arquivo de áudio ou vídeo (até 60 MB)</label>
        <input class="field mb-4" id="converter-media" type="file" accept="audio/*,video/*,.mkv,.avi,.mov,.flac" onchange={selectMedia} />
        <label class="label" for="converter-media-output">Formato de saída</label>
        <select class="field mb-5" id="converter-media-output" bind:value={mediaOutput}>
          <option value="mp3">MP3 · áudio</option><option value="wav">WAV · áudio</option><option value="ogg">OGG · áudio</option><option value="m4a">M4A · áudio</option><option value="mp4">MP4 · vídeo</option><option value="webm">WebM · vídeo</option><option value="gif">GIF · primeiros 8s</option>
        </select>
        <div class="flex flex-wrap gap-3"><button class="pixel-button px-4 py-3 bg-violet-600 text-white" onclick={convertMedia} disabled={running||!mediaFile}>CONVERTER MÍDIA</button>{#if running}<button class="pixel-button px-4 py-3 bg-[var(--panel)]" onclick={cancelMedia}>CANCELAR</button>{/if}</div>
      {/if}
      {#if running}<div class="progress-track mt-6" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style:width={`${progress}%`}></div></div>{/if}
      {#if status}<p class="mt-5 text-sm" role="status">{status}</p>{/if}
      {#if error}<p class="mt-5 text-sm text-red-600 dark:text-red-300" role="alert">{error}</p>{/if}
    </section>
    <aside class="pixel p-6 space-y-4"><h2 class="section-heading">FEITO NO SEU DISPOSITIVO</h2><p class="text-sm muted">As imagens usam Canvas, documentos usam PDF.js, Mammoth e Typst WASM, e dados usam um parser local. Nenhum arquivo precisa ser enviado a um backend.</p><h3 class="text-sm font-semibold">Formatos avançados</h3><p class="text-sm muted">O Aletheia possui FFmpeg WASM de thread única para arquivos curtos. Para lotes e formatos especializados, o VERT oferece mais recursos.</p><a class="inline-block underline text-indigo-600 dark:text-indigo-300" href="https://vert.sh/" rel="noopener noreferrer" target="_blank">Abrir VERT para mais formatos ↗</a><p class="text-xs muted">Aletheia não incorpora o código AGPL do VERT nesta distribuição.</p></aside>
  </div>
</div>
