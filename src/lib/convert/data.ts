export function csvToJson(input:string):Record<string,string>[] {
  // RFC 4180-inspired parser, including quoted separators, escaped quotes and line breaks.
  const rows:string[][]=[];let row:string[]=[];let value='';let quoted=false;
  const s=input.replace(/^\uFEFF/,'');
  for(let i=0;i<s.length;i++){
    const char=s[i];
    if(quoted){
      if(char==='"'&&s[i+1]==='"'){value+='"';i++;}
      else if(char==='"')quoted=false;
      else value+=char;
    }else if(char==='"'&&value===''){quoted=true;}
    else if(char===','){row.push(value);value='';}
    else if(char==='\n'||char==='\r'){
      if(char==='\r'&&s[i+1]==='\n')i++;
      row.push(value);if(row.some(v=>v!==''))rows.push(row);row=[];value='';
    }else value+=char;
  }
  if(quoted)throw new Error('CSV com aspas não fechadas.');
  row.push(value);if(row.some(v=>v!==''))rows.push(row);
  if(rows.length<1)return[];
  const headers=rows[0].map((key,i)=>key.trim()||`coluna_${i+1}`);
  if(new Set(headers).size!==headers.length)throw new Error('O CSV tem títulos de coluna duplicados.');
  return rows.slice(1).map(cells=>Object.fromEntries(headers.map((key,i)=>[key,cells[i]??''])));
}
function quoteCsv(value:unknown):string{
  const s=value==null?'':typeof value==='object'?JSON.stringify(value):String(value);
  // Mitigate formula injection when the file is opened by spreadsheet applications.
  const safe=typeof value==='string' && /^[\s]*[=+@-]/.test(s)?`'${s}`:s;
  return /[",\r\n]/.test(safe)?`"${safe.replace(/"/g,'""')}"`:safe;
}
export function jsonToCsv(json:string):string{
  const parsed:unknown=JSON.parse(json);
  if(!Array.isArray(parsed))throw new Error('O JSON deve ser uma lista de objetos.');
  if(parsed.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw new Error('Todos os itens devem ser objetos.');
  const records=parsed as Record<string,unknown>[];
  const keys=[...new Set(records.flatMap(obj=>Object.keys(obj)))];
  if(!keys.length)return '';
  return [keys.map(quoteCsv).join(','),...records.map(obj=>keys.map(key=>quoteCsv(obj[key])).join(','))].join('\r\n');
}
