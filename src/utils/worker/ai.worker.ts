import { pipeline, env, TextStreamer } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.proxy = false; 
  env.backends.onnx.wasm.numThreads = Math.max(1, (navigator.hardwareConcurrency || 1) - 1);
}

let pipe: any = null;
let currentDevice: string = "";
let currentModel: string = "";

self.onmessage = async (e) => {
  const { text, device, model } = e.data;

  try {
    if (pipe && (currentDevice !== device || currentModel !== model)) {
      if (typeof pipe.dispose === 'function') await pipe.dispose();
      pipe = null; 
    }
    currentDevice = device;
    currentModel = model;

    if (!pipe) {
      pipe = await pipeline("text-generation", model, {
        device: device, 
        dtype: "q4",
        progress_callback: (data: any) => {
          self.postMessage(data);
        }
      });
    }

    const streamer = new TextStreamer(pipe.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token: string) => {
        self.postMessage({ status: 'thinking', token });
      },
    });

    const messages = [
      { 
        role: "system", 
        content: `Você é um extrator de dados JSON estrito.
Sua única função é ler o texto fornecido e retornar UM OBJETO JSON PURO, sem formatação markdown e sem texto antes ou depois.

REGRAS OBRIGATÓRIAS:
1. Extraia apenas os dados presentes no texto.
2. Se uma informação não existir, preencha com "". Nunca invente dados.
3. No campo "descricao" (experiencias/formacao), use "\\n" para separar diferentes tópicos ou conquistas.
4. O campo "links" DEVE ser uma única string contendo as URLs completas separadas por vírgula. É PROIBIDO usar arrays [] neste campo.
5. Em "habilidades", use ESTRITAMENTE as chaves "categoria" e "itens". Não adicione "descricao".
6. Use EXATAMENTE esta estrutura de chaves:
{
  "nome": "",
  "email": "",
  "telefone": "",
  "localizacao": "",
  "links": "",
  "resumo": "",
  "experiencias": [{"cargo": "", "empresa": "", "periodo": "", "local": "", "tipo": "", "descricao": ""}],
  "formacao": [{"instituicao": "", "curso": "", "periodo": "", "descricao": ""}],
  "habilidades": [{"categoria": "", "itens": ""}]
}` 
      },
      { 
        role: "user", 
        content: `TEXTO DO CURRÍCULO:
---
${text.substring(0, 3000)}
---

Gere APENAS o JSON válido correspondente aos dados acima:`
      }
    ];

    const prompt = pipe.tokenizer.apply_chat_template(messages, { 
      tokenize: false, 
      add_generation_prompt: true 
    });

    const out = await pipe(prompt, { 
      max_new_tokens: 4096,
      temperature: 0.0,
      top_p: 1.0,
      do_sample: false,
      return_full_text: false,
      streamer 
    });

    const generated = out[0].generated_text;
    
    let cleanJson = generated
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/\/\/.*$/gm, "") 
      .replace(/<\|.*?\|>/g, "") 
      .trim();
      
    const startIdx = cleanJson.indexOf('{');
    const endIdx = cleanJson.lastIndexOf('}');

    if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
      cleanJson = cleanJson.substring(startIdx, endIdx + 1);
    }

    try {
      let parsedData = JSON.parse(cleanJson);
      if (Array.isArray(parsedData.links)) {
        parsedData.links = parsedData.links.join(", ");
      }

      if (Array.isArray(parsedData.habilidades)) {
        parsedData.habilidades = parsedData.habilidades.map((h: any) => ({
          categoria: h.categoria || "",
          itens: h.itens || ""
        }));
      }

      parsedData.experiencias = parsedData.experiencias || [];
      parsedData.formacao = parsedData.formacao || [];
      parsedData.habilidades = parsedData.habilidades || [];
      self.postMessage({ status: 'complete', data: parsedData });
      
    } catch (parseError) {
      console.warn("Atenção: JSON inválido.", cleanJson);
      self.postMessage({ 
        status: 'complete', 
        data: { 
          nome: "[ALERTA] JSON Inválido", 
          resumo: "A IA não conseguiu formatar corretamente. Saída bruta:\n\n" + cleanJson,
          experiencias: [], formacao: [], habilidades: []
        } 
      });
    }

  } catch (error: any) {
    console.error("Erro Crítico no Engine:", error);
    self.postMessage({ 
      status: 'error', 
      error: error.message || "O motor falhou. O ficheiro pode ser muito grande ou a RAM excedeu o limite." 
    });
  }
};