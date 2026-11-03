<script lang="ts">
  import { onMount } from 'svelte';
  import { createEmptyResume, blankExperience, blankEducation, blankSkill, blankSection, type ResumeData } from '../lib/cv/types.ts';
  import { parseResumeText, normalizeResumeData } from '../lib/cv/parser.ts';
  import { extractText } from '../lib/cv/extract.ts';
  import { compileTypstSource, generateTypstSource, saveBlob, type CvLang } from '../lib/cv/typst.ts';
  import { LocalCvAI } from '../lib/cv/ai.ts';

  const storageKey = 'aletheia.cv.v2';
  const ai = new LocalCvAI();
  let cv = $state<ResumeData>(createEmptyResume());
  let lang = $state<CvLang>('pt');
  let hydrated = $state(false);
  let currentFile = $state('');
  let rawText = $state('');
  let status = $state('');
  let error = $state('');
  let busy = $state(false);
  let aiBusy = $state(false);
  let aiProgress = $state(0);
  let previewUrl = $state('');
  let helpOpen = $state(false);
  let allowReset = $state(false);
  let activeSection = $state<'personal'|'experience'|'skills'|'education'|'custom'>('personal');
  let inputRef: HTMLInputElement;
  let draftName = $derived(cv.nome.trim() ? cv.nome.trim().replace(/[^\p{L}\p{N}-]+/gu,'_') : 'curriculo');
  let completion = $derived([
    Boolean(cv.nome.trim()), Boolean(cv.email.trim()), Boolean(cv.telefone.trim()),
    Boolean(cv.resumo.trim()), cv.experiencias.some(x=>x.cargo && x.empresa),
    cv.formacao.some(x=>x.curso), cv.habilidades.some(x=>x.itens)
  ].filter(Boolean).length);

  onMount(() => {
    try {
      const saved = localStorage.getItem(storageKey) ?? localStorage.getItem('aletheia_draft');
      if (saved) cv = normalizeResumeData(JSON.parse(saved));
      const language = localStorage.getItem('aletheia.cv.lang');
      if (language==='en') lang='en';
    } catch { status='Rascunho anterior inválido; começando um novo.'; }
    hydrated=true;
    return () => {ai.cancel(); if(previewUrl) URL.revokeObjectURL(previewUrl);};
  });
  $effect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey,JSON.stringify(cv)); } catch {status='Armazenamento local cheio ou bloqueado. Exporte o projeto como JSON.';}
  });
  $effect(() => { if(hydrated) { try {localStorage.setItem('aletheia.cv.lang',lang);} catch{} } });

  const L=(pt:string,en:string)=>lang==='pt'?pt:en;
  const errMsg=(e:unknown)=>e instanceof Error?e.message:String(e);
  async function loadFile(file:File) {
    error=''; status=''; busy=true;
    try {
      if(file.name.toLowerCase().endsWith('.json')) {
        if(file.size > 2_000_000) throw new Error('Projeto JSON grande demais.');
        cv=normalizeResumeData(JSON.parse(await file.text()));
        rawText=''; status='Projeto restaurado.';
      } else {
        const text=await extractText(file);
        if(!text.trim()) throw new Error('Não foi possível encontrar texto no arquivo.');
        rawText=text;cv=parseResumeText(text); status='Importado. Confira e corrija cada campo antes de exportar.';
      }
      currentFile=file.name;
      activeSection='personal';
    } catch(e) {error=errMsg(e);} finally {busy=false;}
  }
  function chooseFile(e:Event) {
    const input=e.currentTarget as HTMLInputElement;
    const f=input.files?.[0]; if(f) void loadFile(f);input.value='';
  }
  function dropFile(e:DragEvent) {e.preventDefault();const f=e.dataTransfer?.files?.[0];if(f)void loadFile(f);}
  function reset() {
    if(!allowReset){allowReset=true;return;}
    ai.cancel();cv=createEmptyResume();rawText='';currentFile='';status='Novo currículo iniciado.';error='';allowReset=false;
    if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}
  }
  function downloadJSON() {saveBlob(new Blob([JSON.stringify(cv,null,2)],{type:'application/json'}),`${draftName}.aletheia.json`);}
  function downloadTypst() {saveBlob(new Blob([generateTypstSource(cv,lang)],{type:'text/plain;charset=utf-8'}),`${draftName}.typ`);}
  async function makePDF(download:boolean) {
    busy=true;error='';status='Compilando PDF no seu navegador...';
    try {
      const pdf=await compileTypstSource(generateTypstSource(cv,lang));
      if(download)saveBlob(pdf,`${draftName}.pdf`);
      else {if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(pdf);}
      status=download?'PDF exportado.':'Prévia pronta.';
    }catch(e){error=`Erro no Typst: ${errMsg(e)}`;}finally{busy=false;}
  }
  async function runAI() {
    if(!rawText.trim()) {error='Importe PDF, DOCX ou TXT para usar a IA local.';return;}
    const snapshot=JSON.stringify(cv);
    const confirmed=window.confirm('A IA substituirá os campos do formulário pelos dados extraídos. Exportar um backup JSON antes de continuar?');
    if(confirmed)downloadJSON();
    aiBusy=true;aiProgress=0;error='';status='Carregando IA local...';
    try{
      const fromAI=await ai.run(rawText,e=>{
        status=e.message||'Processando...';
        if(typeof e.progress==='number') aiProgress=e.progress;
      });
      // An extraction that returns nothing useful must never overwrite an existing draft.
      if(!fromAI.nome&&!fromAI.email&&!fromAI.experiencias.length&&!fromAI.formacao.length) throw new Error('A IA não encontrou informações válidas.');
      cv=fromAI;status='IA concluída. Revise todos os campos: modelos locais podem errar.';
    }catch(e){cv=normalizeResumeData(JSON.parse(snapshot));error=errMsg(e);}finally{aiBusy=false;}
  }
  function stopAI(){ai.cancel();aiBusy=false;status='IA interrompida. Dados manuais preservados.';}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-7">
  <div class="pixel p-4 mb-7 grid lg:grid-cols-[1fr_auto] gap-4 items-center">
    <div class="flex flex-wrap items-center gap-3">
      <label class="pixel-button bg-indigo-500 text-white px-4 py-3 inline-flex gap-2 items-center cursor-pointer">
        <input bind:this={inputRef} class="sr-only" type="file" accept=".pdf,.docx,.txt,.md,.json" onchange={chooseFile} aria-label="Importar currículo ou projeto JSON" />
        ↓ {L('IMPORTAR ARQUIVO','IMPORT FILE')}
      </label>
      <button type="button" onclick={reset} class="pixel-button px-4 py-3 bg-[var(--panel)]">{allowReset?'CONFIRMAR LIMPEZA':'NOVO CV'}</button>
      {#if allowReset}<button type="button" class="text-sm underline muted" onclick={()=>allowReset=false}>Cancelar</button>{/if}
      <span class="text-sm muted">{currentFile||'PDF · DOCX · TXT · JSON'}</span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <label for="cv-lang" class="text-xs font-semibold">IDIOMA</label>
      <select id="cv-lang" bind:value={lang} class="field !w-auto"><option value="pt">Português</option><option value="en">English</option></select>
      <button onclick={()=>helpOpen=!helpOpen} class="pixel-button px-3 py-3 bg-[var(--panel)]" aria-expanded={helpOpen}>?</button>
    </div>
  </div>
  {#if helpOpen}
    <div class="pixel p-4 mb-6 text-sm leading-relaxed">O parser local lê dados sem enviar o arquivo a nenhum servidor. A IA é opcional e baixa um modelo na primeira execução. Os rascunhos são salvos somente neste navegador. PDFs digitalizados não possuem texto extraível e exigem OCR. A exportação Typst/PDF acontece localmente.</div>
  {/if}
  {#if status}<div role="status" class="border-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 text-sm px-4 py-3 mb-4">{status}</div>{/if}
  {#if error}<div role="alert" class="border-2 border-red-600 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 text-sm px-4 py-3 mb-4">{error}</div>{/if}
  <div class="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] gap-7 items-start">
    <div class="space-y-6">
      <section class="pixel p-4 sm:p-6" ondragover={e=>e.preventDefault()} ondrop={dropFile} aria-label="Importar e análise">
        <div class="flex flex-wrap justify-between gap-3 items-center mb-3">
          <h2 class="section-heading">EXTRAÇÃO & IA LOCAL</h2>
          <span class="text-xs muted">Sem upload para servidor</span>
        </div>
        <p class="text-sm muted mb-4">Arraste um currículo nesta área ou importe um arquivo. A extração automática é uma estimativa, não uma garantia.</p>
        <div class="flex flex-wrap gap-3 items-center">
          {#if !aiBusy}<button type="button" class="pixel-button bg-indigo-600 text-white px-4 py-3" onclick={runAI} disabled={!rawText||busy}>OTIMIZAR EXTRAÇÃO COM IA</button>
          {:else}<button type="button" class="pixel-button bg-red-500 text-white px-4 py-3" onclick={stopAI}>CANCELAR IA</button>{/if}
          {#if rawText}<span class="text-xs muted">{rawText.length.toLocaleString('pt-BR')} caracteres extraídos</span>{/if}
        </div>
        {#if aiBusy}<div class="progress-track mt-4" role="progressbar" aria-valuenow={aiProgress} aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style:width={`${aiProgress}%`}></div></div>{/if}
      </section>
      <section class="pixel p-4 sm:p-6">
        <div class="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Seções do currículo">
          {#each [{id:'personal',title:'IDENTIDADE'},{id:'experience',title:'EXPERIÊNCIA'},{id:'skills',title:'HABILIDADES'},{id:'education',title:'FORMAÇÃO'},{id:'custom',title:'EXTRAS'}] as tab}
            <button type="button" role="tab" aria-selected={activeSection===tab.id} onclick={()=>activeSection=tab.id as typeof activeSection} class={`text-xs border-2 border-[var(--edge)] px-3 py-2 font-semibold bg-[var(--panel)] ${activeSection===tab.id ? "!bg-indigo-600 !text-white" : ""}`}>{tab.title}</button>
          {/each}
        </div>
        {#if activeSection==='personal'}
          <h2 class="section-heading mb-4">IDENTIDADE</h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2"><label class="label" for="cv-name">Nome completo</label><input id="cv-name" class="field" bind:value={cv.nome} placeholder="Nome Sobrenome" /></div>
            <div><label class="label" for="cv-email">E-mail</label><input id="cv-email" class="field" type="email" bind:value={cv.email} placeholder="voce@email.com" /></div>
            <div><label class="label" for="cv-phone">Telefone</label><input id="cv-phone" class="field" bind:value={cv.telefone} placeholder="(11) 99999-9999" /></div>
            <div class="sm:col-span-2"><label class="label" for="cv-city">Cidade / localização</label><input id="cv-city" class="field" bind:value={cv.localizacao} placeholder="São Paulo, SP" /></div>
            <div class="sm:col-span-2"><label class="label" for="cv-links">Links profissionais (separe por vírgula)</label><input id="cv-links" class="field" bind:value={cv.links} placeholder="github.com/usuario, linkedin.com/in/usuario" /></div>
            <div class="sm:col-span-2"><label class="label" for="cv-summary">Resumo profissional</label><textarea id="cv-summary" rows="5" class="field" bind:value={cv.resumo} placeholder="Seu perfil profissional em 3 ou 4 frases"></textarea></div>
          </div>
        {:else if activeSection==='experience'}
          <div class="flex justify-between gap-2 items-center mb-4"><h2 class="section-heading">EXPERIÊNCIA</h2><button class="pixel-button bg-emerald-500 text-zinc-950 px-3 py-2" onclick={()=>cv.experiencias.push(blankExperience())}>+ ADICIONAR</button></div>
          {#if cv.experiencias.length===0}<p class="muted text-sm">Nenhuma experiência adicionada.</p>{/if}
          {#each cv.experiencias as job, idx (job.id)}
            <div class="border-2 border-[var(--edge)] p-4 mb-4 space-y-3">
              <div class="flex justify-between gap-2"><h3 class="font-bold text-sm">Experiência {idx+1}</h3><button class="text-red-500 underline text-sm" onclick={()=>cv.experiencias=cv.experiencias.filter(x=>x.id!==job.id)}>Remover</button></div>
              <div><label class="label" for={`job-title-${job.id}`}>Cargo</label><input class="field" id={`job-title-${job.id}`} bind:value={job.cargo} /></div>
              <div><label class="label" for={`job-company-${job.id}`}>Empresa</label><input class="field" id={`job-company-${job.id}`} bind:value={job.empresa} /></div>
              <div class="grid sm:grid-cols-2 gap-3"><div><label class="label" for={`job-dates-${job.id}`}>Período</label><input class="field" id={`job-dates-${job.id}`} bind:value={job.periodo} placeholder="2022 - Atual" /></div><div><label class="label" for={`job-local-${job.id}`}>Local</label><input class="field" id={`job-local-${job.id}`} bind:value={job.local} /></div></div>
              <div><label class="label" for={`job-type-${job.id}`}>Tipo de vínculo</label><input class="field" id={`job-type-${job.id}`} bind:value={job.tipo} placeholder="Estágio, CLT, freelance..." /></div>
              <div><label class="label" for={`job-desc-${job.id}`}>Atividades e resultados (uma por linha)</label><textarea id={`job-desc-${job.id}`} rows="4" class="field" bind:value={job.descricao}></textarea></div>
            </div>
          {/each}
        {:else if activeSection==='skills'}
          <div class="flex justify-between gap-2 items-center mb-4"><h2 class="section-heading">HABILIDADES</h2><button class="pixel-button bg-emerald-500 text-zinc-950 px-3 py-2" onclick={()=>cv.habilidades.push(blankSkill())}>+ ADICIONAR</button></div>
          {#if !cv.habilidades.length}<p class="muted text-sm">Adicione linguagens, ferramentas e competências.</p>{/if}
          {#each cv.habilidades as skill (skill.id)}
            <div class="grid sm:grid-cols-[.5fr_1fr_auto] items-end gap-3 mb-4">
              <div><label class="label" for={`skill-category-${skill.id}`}>Categoria</label><input class="field" id={`skill-category-${skill.id}`} bind:value={skill.categoria} placeholder="Linguagens" /></div>
              <div><label class="label" for={`skill-items-${skill.id}`}>Itens</label><input class="field" id={`skill-items-${skill.id}`} bind:value={skill.itens} placeholder="Python, SQL, Rust" /></div>
              <button class="text-red-500 underline text-sm pb-3" onclick={()=>cv.habilidades=cv.habilidades.filter(x=>x.id!==skill.id)}>Remover</button>
            </div>
          {/each}
        {:else if activeSection==='education'}
          <div class="flex justify-between gap-2 items-center mb-4"><h2 class="section-heading">FORMAÇÃO</h2><button class="pixel-button bg-emerald-500 text-zinc-950 px-3 py-2" onclick={()=>cv.formacao.push(blankEducation())}>+ ADICIONAR</button></div>
          {#if !cv.formacao.length}<p class="muted text-sm">Nenhuma formação adicionada.</p>{/if}
          {#each cv.formacao as edu, idx (edu.id)}
            <div class="border-2 border-[var(--edge)] p-4 space-y-3 mb-4">
              <div class="flex justify-between gap-2"><h3 class="font-bold text-sm">Formação {idx+1}</h3><button class="text-red-500 underline text-sm" onclick={()=>cv.formacao=cv.formacao.filter(x=>x.id!==edu.id)}>Remover</button></div>
              <div><label class="label" for={`edu-course-${edu.id}`}>Curso</label><input id={`edu-course-${edu.id}`} class="field" bind:value={edu.curso}/></div>
              <div><label class="label" for={`edu-inst-${edu.id}`}>Instituição</label><input id={`edu-inst-${edu.id}`} class="field" bind:value={edu.instituicao}/></div>
              <div><label class="label" for={`edu-dates-${edu.id}`}>Período</label><input id={`edu-dates-${edu.id}`} class="field" bind:value={edu.periodo}/></div>
              <div><label class="label" for={`edu-desc-${edu.id}`}>Detalhes</label><textarea id={`edu-desc-${edu.id}`} class="field" rows="2" bind:value={edu.descricao}></textarea></div>
            </div>
          {/each}
        {:else}
          <div class="flex justify-between gap-2 items-center mb-4"><h2 class="section-heading">SEÇÕES EXTRAS</h2><button class="pixel-button bg-emerald-500 text-zinc-950 px-3 py-2" onclick={()=>cv.secoes.push(blankSection())}>+ ADICIONAR</button></div>
          <p class="text-sm muted mb-4">Inclua projetos, idiomas, certificações ou voluntariado.</p>
          {#each cv.secoes as item (item.id)}
            <div class="border-2 border-[var(--edge)] p-4 space-y-3 mb-4">
              <div class="flex justify-end"><button class="text-red-500 underline text-sm" onclick={()=>cv.secoes=cv.secoes.filter(x=>x.id!==item.id)}>Remover</button></div>
              <div><label class="label" for={`extra-title-${item.id}`}>Título da seção</label><input id={`extra-title-${item.id}`} class="field" bind:value={item.titulo}/></div>
              <div><label class="label" for={`extra-body-${item.id}`}>Conteúdo (uma linha por tópico)</label><textarea id={`extra-body-${item.id}`} class="field" rows="4" bind:value={item.conteudo}></textarea></div>
            </div>
          {/each}
        {/if}
      </section>
    </div>
    <aside class="space-y-6 lg:sticky lg:top-5">
      <section class="pixel p-5 space-y-4">
        <h2 class="section-heading">EXPORTAÇÃO</h2>
        <div class="flex justify-between text-sm"><span class="muted">Preenchimento do currículo</span><span class="font-bold">{completion}/7</span></div>
        <div class="progress-track" role="progressbar" aria-label="Preenchimento" aria-valuemin="0" aria-valuemax="7" aria-valuenow={completion}><div class="progress-fill" style:width={`${completion/7*100}%`}></div></div>
        <p class="text-xs muted">Indicador de campos preenchidos, não é pontuação ATS. Adapte seu currículo à vaga e revise a ortografia.</p>
        <div class="grid sm:grid-cols-2 gap-3">
          <button class="pixel-button px-3 py-3 bg-indigo-600 text-white" disabled={busy||aiBusy} onclick={()=>makePDF(true)}>{busy?'GERANDO...':'BAIXAR PDF'}</button>
          <button class="pixel-button px-3 py-3 bg-[var(--panel)]" disabled={busy||aiBusy} onclick={()=>makePDF(false)}>PRÉVIA PDF</button>
          <button class="pixel-button px-3 py-3 bg-[var(--panel)]" onclick={downloadTypst}>BAIXAR .TYP</button>
          <button class="pixel-button px-3 py-3 bg-[var(--panel)]" onclick={downloadJSON}>BACKUP JSON</button>
        </div>
      </section>
      <section class="pixel p-5 bg-white text-zinc-900 !border-zinc-600 !shadow-[4px_4px_0_#787878]">
        <div class="text-xs text-zinc-500 mb-5 flex justify-between"><span>PRÉVIA SIMPLIFICADA</span><span>A4</span></div>
        <div class="max-w-xl mx-auto break-words">
          <h3 class="text-center text-xl font-bold mb-1">{cv.nome||'Seu Nome'}</h3>
          <p class="text-center text-xs text-zinc-600 mb-2">{[cv.localizacao,cv.email,cv.telefone].filter(Boolean).join(' • ')}</p>
          {#if cv.links}<p class="text-center text-xs text-indigo-700 break-all mb-4">{cv.links}</p>{/if}
          {#if cv.resumo}<div class="mt-4"><h4 class="font-bold text-xs uppercase border-b border-zinc-500 pb-1 mb-2">Resumo profissional</h4><p class="text-xs leading-relaxed whitespace-pre-line">{cv.resumo}</p></div>{/if}
          {#if cv.experiencias.length}<div class="mt-4"><h4 class="font-bold text-xs uppercase border-b border-zinc-500 pb-1 mb-2">Experiência</h4>{#each cv.experiencias as x (x.id)}<div class="mb-3"><p class="text-xs font-bold">{x.cargo} <span class="font-normal text-zinc-600">{x.periodo}</span></p><p class="text-xs italic">{x.empresa}</p><p class="text-xs whitespace-pre-line">{x.descricao}</p></div>{/each}</div>{/if}
          {#if cv.habilidades.length}<div class="mt-4"><h4 class="font-bold text-xs uppercase border-b border-zinc-500 pb-1 mb-2">Habilidades</h4>{#each cv.habilidades as x (x.id)}<p class="text-xs"><b>{x.categoria}:</b> {x.itens}</p>{/each}</div>{/if}
          {#if cv.formacao.length}<div class="mt-4"><h4 class="font-bold text-xs uppercase border-b border-zinc-500 pb-1 mb-2">Formação</h4>{#each cv.formacao as x (x.id)}<div class="mb-2"><p class="text-xs font-semibold">{x.curso} <span class="font-normal text-zinc-600">{x.periodo}</span></p><p class="text-xs italic">{x.instituicao}</p></div>{/each}</div>{/if}
          {#each cv.secoes as x (x.id)}{#if x.titulo}<div class="mt-4"><h4 class="font-bold text-xs uppercase border-b border-zinc-500 pb-1 mb-2">{x.titulo}</h4><p class="text-xs whitespace-pre-line">{x.conteudo}</p></div>{/if}{/each}
        </div>
      </section>
    </aside>
  </div>
</div>
{#if previewUrl}
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3" role="presentation" onclick={e=>{if(e.target===e.currentTarget){URL.revokeObjectURL(previewUrl);previewUrl='';}}}>
    <div class="bg-[var(--panel)] border-2 border-[var(--edge)] w-full max-w-4xl h-[93vh] flex flex-col p-3 gap-3" role="dialog" aria-modal="true" aria-label="Prévia do PDF">
      <div class="flex justify-between items-center gap-3"><h2 class="section-heading">PRÉVIA PDF · TYPST</h2><button class="pixel-button bg-indigo-600 text-white px-3 py-2" onclick={()=>{URL.revokeObjectURL(previewUrl);previewUrl='';}}>FECHAR</button></div>
      <iframe title="Prévia do currículo PDF" src={previewUrl} class="w-full flex-1 border border-[var(--edge)]"></iframe>
    </div>
  </div>
{/if}
