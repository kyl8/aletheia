export async function extractText(file:File):Promise<string> {
  if(file.size>15*1024*1024) throw new Error('O arquivo ultrapassa o limite de 15 MB.');
  const ext=file.name.toLowerCase().split('.').pop();
  if(ext==='txt' || ext==='md') return await file.text();
  if(ext==='docx') {
    const mammoth=await import('mammoth');
    const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
    return result.value;
  }
  if(ext==='pdf') {
    const pdfjs=await import('pdfjs-dist');
    const workerUrl=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc=workerUrl.default;
    const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
    try{
      const lines:string[]=[];
      for(let i=1;i<=pdf.numPages;i++){
        const page=await pdf.getPage(i);
        const content=await page.getTextContent();
        const items=content.items.filter((x:unknown)=> x !== null && typeof x === 'object' && 'str' in x) as Array<{str:string;transform:number[];width:number}>;
        const groups:{y:number;items:typeof items}[]=[];
        for(const item of items){const y=item.transform[5];let group=groups.find(x=>Math.abs(x.y-y)<3);if(!group){group={y,items:[]};groups.push(group);}group.items.push(item);}
        groups.sort((a,b)=>b.y-a.y);
        const pageText=groups.map(group=>{
          group.items.sort((a,b)=>a.transform[4]-b.transform[4]);
          let s='';let last=-Infinity;
          for(const it of group.items){if(it.transform[4]-last>3 && last!==-Infinity)s+=' ';s+=it.str;last=it.transform[4]+it.width;}
          return s.trim();
        }).filter(Boolean);
        lines.push(pageText.join('\n'));
      }
      const result=lines.join('\n\n');
      if(!result.trim()) throw new Error('O PDF não contém texto extraível. PDFs digitalizados precisam de OCR.');
      return result;
    }finally{await pdf.destroy();}
  }
  throw new Error('Formato não suportado. Use PDF, DOCX, TXT ou MD.');
}
