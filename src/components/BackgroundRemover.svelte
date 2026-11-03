<script lang="ts">
  import {onMount} from 'svelte';
  import {composeResult,loadImage} from '../lib/bg/remove.ts';
  import {saveBlob} from '../lib/cv/typst.ts';
  let source=$state('');
  let result=$state('');
  let sourceName=$state('imagem');
  let busy=$state(false);
  let progress=$state(0);
  let status=$state('');
  let error=$state('');
  let beforeAfter=$state(50);
  let worker:Worker|null=null;
  let lastOutput:Blob|null=null;
  onMount(()=>()=>{worker?.terminate();if(source)URL.revokeObjectURL(source);if(result)URL.revokeObjectURL(result);});
  async function receive(file:File){
    error='';status='';
    if(!file.type.startsWith('image/')){error='Escolha uma imagem PNG, JPEG ou WebP.';return;}
    if(file.size>15*1024*1024){error='Imagem muito grande (máximo 15 MB).';return;}
    const u=URL.createObjectURL(file);
    try{
      const img=await loadImage(u);
      if(img.naturalWidth*img.naturalHeight>16_000_000)throw new Error('A imagem ultrapassa 16 megapixels. Reduza a resolução primeiro.');
      if(source)URL.revokeObjectURL(source);
      if(result)URL.revokeObjectURL(result);
      source=u;result='';lastOutput=null;sourceName=file.name.replace(/\.[^.]+$/,'');beforeAfter=50;
    }catch(e){URL.revokeObjectURL(u);error=e instanceof Error?e.message:'Erro ao ler imagem';}
  }
  function pick(e:Event){const el=e.currentTarget as HTMLInputElement;const f=el.files?.[0];if(f)void receive(f);el.value='';}
  function drop(e:DragEvent){e.preventDefault();const f=e.dataTransfer?.files?.[0];if(f)void receive(f);}
  function reset(){worker?.terminate();worker=null;busy=false;progress=0;error='';status='';if(source)URL.revokeObjectURL(source);if(result)URL.revokeObjectURL(result);source='';result='';lastOutput=null;}
  async function remove(){
    if(!source)return;
    busy=true;progress=0;error='';status='Preparando IA local...';
    worker?.terminate();worker=new Worker(new URL('../workers/bg.worker.ts',import.meta.url),{type:'module'});
    const canvasImage=await fetch(source).then(r=>r.blob());
    const imageAsDataUrl=await new Promise<string>((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(new Error('Falha ao ler imagem'));r.readAsDataURL(canvasImage);});
    worker.onmessage=async(e:MessageEvent<{status:string;progress?:number;message?:string;mask?:string}>)=>{
      const msg=e.data;
      if(msg.status==='complete'&&msg.mask){
        try{
          status='Compondo transparência...';
          const blob=await composeResult(source,msg.mask);
          if(result)URL.revokeObjectURL(result);
          result=URL.createObjectURL(blob);lastOutput=blob;status='Concluído. Baixe seu PNG transparente.';
        }catch(err){error=err instanceof Error?err.message:'Erro ao gerar imagem';}finally{busy=false;}
      }else if(msg.status==='error'){error=msg.message||'Falha ao remover fundo.';busy=false;}
      else {status=msg.message||'Processando imagem...';if(typeof msg.progress==='number')progress=msg.progress;}
    };
    worker.onerror=()=>{error='Falha no motor de IA. Tente outro navegador ou imagem menor.';busy=false;};
    worker.postMessage({image:imageAsDataUrl});
  }
  function save(){if(lastOutput)saveBlob(lastOutput,`${sourceName}-sem-fundo.png`);}
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">
  <div class="mb-9"><p class="font-['Silkscreen'] text-xs text-emerald-600 dark:text-emerald-300 mb-3">ALETHEIA / IMAGENS</p><h1 class="font-['Silkscreen'] text-2xl sm:text-3xl mb-3">Removedor de fundo</h1><p class="muted max-w-3xl">IA local com BRIA RMBG. Sua imagem fica no navegador. O modelo é baixado na primeira execução e pode exigir bastante memória.</p></div>
  <div class="grid lg:grid-cols-[1fr_.7fr] gap-6 items-start">
    <div class="pixel p-4 sm:p-6">
      {#if !source}
        <div class="min-h-72 border-2 border-dashed border-indigo-500 grid place-items-center text-center p-7" ondragover={e=>e.preventDefault()} ondrop={drop} role="region" aria-label="Área de upload">
          <div><span class="text-5xl block mb-4" aria-hidden="true">▧</span><h2 class="section-heading mb-3">CLIQUE OU ARRASTE UMA IMAGEM</h2><p class="muted text-sm mb-5">PNG, JPEG ou WebP · Até 15 MB · Até 16 MP</p><label class="pixel-button px-4 py-3 inline-block bg-indigo-600 text-white cursor-pointer"><input type="file" class="sr-only" accept="image/png,image/jpeg,image/webp" onchange={pick}/>ESCOLHER IMAGEM</label></div>
        </div>
      {:else}
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 class="section-heading">{result?'COMPARAR RESULTADO':'IMAGEM CARREGADA'}</h2><button class="underline text-sm" onclick={reset}>Limpar</button></div>
        <div class="relative bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] overflow-hidden min-h-60 grid place-items-center" style="max-height:580px">
          <img src={source} alt="Imagem original" class="object-contain max-h-[560px] w-full" />
          {#if result}<div class="absolute inset-0 overflow-hidden" style:clip-path={`inset(0 ${100-beforeAfter}% 0 0)`}><img src={result} alt="Imagem com fundo removido" class="object-contain max-h-[560px] w-full h-full" /></div><div class="absolute top-0 bottom-0 w-0.5 bg-indigo-600 pointer-events-none" style:left={`${beforeAfter}%`}></div>{/if}
        </div>
        {#if result}<div class="mt-4"><label class="label" for="compare">Comparar original / sem fundo</label><input id="compare" class="w-full accent-indigo-600" type="range" min="0" max="100" bind:value={beforeAfter} /></div>{/if}
        <div class="flex flex-wrap gap-3 mt-5">
          {#if !result}<button class="pixel-button px-4 py-3 bg-indigo-600 text-white" disabled={busy} onclick={remove}>{busy?'PROCESSANDO...':'REMOVER FUNDO'}</button>{/if}
          {#if result}<button class="pixel-button px-4 py-3 bg-emerald-500 text-zinc-950" onclick={save}>BAIXAR PNG</button>{/if}
          {#if busy}<button class="pixel-button px-4 py-3 bg-[var(--panel)]" onclick={()=>{worker?.terminate();busy=false;status='Processamento cancelado.'}}>CANCELAR</button>{/if}
        </div>
        {#if busy}<div class="progress-track mt-5" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style:width={`${progress}%`}></div></div>{/if}
      {/if}
      {#if status}<p class="mt-5 text-sm" role="status">{status}</p>{/if}
      {#if error}<p class="mt-5 p-3 border-2 border-red-500 text-red-600 dark:text-red-300" role="alert">{error}</p>{/if}
    </div>
    <aside class="pixel p-6 space-y-4"><h2 class="section-heading">COMO FUNCIONA</h2><p class="text-sm muted leading-relaxed">A imagem é processada com um modelo de segmentação via WebGPU quando disponível, ou com fallback para WASM. A primeira execução pode demorar enquanto o navegador baixa o modelo.</p><h3 class="font-semibold text-sm">Privacidade</h3><p class="text-sm muted">Seu arquivo não é enviado ao servidor do Aletheia. O navegador consulta um host externo somente para obter o modelo necessário.</p><h3 class="font-semibold text-sm">Qualidade</h3><p class="text-sm muted">O algoritmo pode falhar em cabelo fino, sombras e imagens muito complexas. Confira o contorno antes de utilizar.</p><a href="/converter/" class="inline-block text-indigo-600 dark:text-indigo-300 underline text-sm">Precisa converter o PNG para outro formato?</a></aside>
  </div>
</div>
