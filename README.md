# Aletheia 2.0

Coleção de ferramentas gratuitas que rodam, quando possível, no próprio navegador.

**Stack:** Astro 5, Svelte 5 (runes), TypeScript, Tailwind CSS 4, Typst WASM, Transformers.js, FFmpeg WASM e GitHub Pages.

## Ferramentas

- **CV:** importar PDF, DOCX, TXT ou MD; parser local; extração opcional com Qwen 2.5 0.5B via Transformers.js; formulários editáveis; seções extras; rascunho no `localStorage`; backups JSON; PDFs e código `.typ` gerados via Typst WASM. Rascunhos antigos de `aletheia_draft` são reconhecidos.
- **Remoção de fundo:** modelo `briaai/RMBG-1.4` em Web Worker. Preferência por WebGPU, com fallback WASM. Cache de modelo no navegador quando suportado. PNG transparente.
- **Conversor:** PNG/JPEG/WebP em lote e exportação ZIP; PDF/DOCX/TXT/MD para texto; documentos de texto para PDF; CSV/JSON; áudio/vídeo usando FFmpeg WASM single-thread (MP3, WAV, OGG, M4A, MP4, WebM e GIF).

Este aplicativo **não contém o código do VERT**: utiliza sua proposta de processamento no navegador e fornece link para o serviço externo quando o usuário precisa de mais formatos. Respeite as licenças dos motores e dos modelos.

## Limitações e privacidade

- Sem backend, login ou banco de dados. O projeto publica somente arquivos estáticos.
- Os arquivos escolhidos são processados no navegador; o Aletheia não os envia a um backend próprio. Modelos de IA e FFmpeg WASM são baixados de fontes externas na primeira utilização. Enquanto um modelo está sendo baixado, a conexão com o provedor externo é necessária.
- FFmpeg single-thread é lento e pode usar muita memória, especialmente no celular; os arquivos têm limite de 60 MB. O GIF usa apenas os primeiros oito segundos. Nem todos os codecs funcionam em todas as plataformas.
- PDF digitalizado sem camada de texto não tem OCR incluído. O parser e a IA podem cometer erros: revise os campos.
- Transformar DOCX/PDF em TXT e recriar PDF **não preserva layouts complexos**, imagens nem tipografia original.
- O indicador de preenchimento do CV não é uma avaliação ATS real.
- Rascunhos locais podem ser apagados pelo navegador. Faça backup JSON antes de limpar os dados.
- GitHub Pages não oferece cabeçalhos COOP/COEP configuráveis para todos os casos; por isso, o FFmpeg integrado usa a variante de thread única.

## Desenvolver

```bash
npm install
npm run dev
npm test
npm run check
npm run build
```

O build estático vai para `dist/`. O workflow `.github/workflows/deploy.yml` roda testes, checagem e build **antes** de enviar ao GitHub Pages.

## Publicar pelo celular, via GitHub Codespaces

1. Salve o arquivo `aletheia-svelte-v2.zip` no telefone.
2. Abra [github.com/kyl8/aletheia](https://github.com/kyl8/aletheia), toque em **Code > Codespaces > Create codespace on main**. Se necessário, use "Site para computador" no navegador.
3. No editor do Codespace, use **Explorer > Upload Files** para enviar o ZIP para a raiz do repositório. Use o terminal integrado.
4. Cole os comandos abaixo:

```bash
unzip -o aletheia-svelte-v2.zip -d /tmp/aletheia-update
bash /tmp/aletheia-update/aletheia/scripts/install-and-publish.sh
```

O script substitui a versão antiga (preserva histórico Git), instala dependências, executa testes, checagem Astro/Svelte e build. **Só faz commit e push na `main` se todos terminarem com sucesso.** Uma falha deixa o conteúdo atual do site publicado e mostra o erro no terminal. Não use GitHub "Upload files" diretamente com o ZIP: o arquivo compactado não será extraído automaticamente.

Acesse [GitHub Actions](https://github.com/kyl8/aletheia/actions) para conferir o deploy, depois [aletheia.kyl8.dev](https://aletheia.kyl8.dev/).

## Créditos/licenças

- [Astro](https://astro.build/), [Svelte](https://svelte.dev/), [Typst.ts](https://github.com/Myriad-Dreamin/typst.ts), [Transformers.js](https://github.com/huggingface/transformers.js), [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm), [VERT](https://github.com/VERT-sh/VERT).
- O código original do Aletheia pertence aos respectivos autores. Verifique o uso comercial e a licença dos modelos BRIA e Qwen conforme seus repositórios.
- VERT possui licença própria e **não foi copiado ou incorporado**.
