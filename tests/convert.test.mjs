import test from 'node:test';
import assert from 'node:assert/strict';
import {csvToJson,jsonToCsv} from '../src/lib/convert/data.ts';
test('CSV com vírgulas e quebras dentro de aspas',()=>{
  const data=csvToJson('nome,descricao\r\n"Ana, Maria","Duas\nlinhas"\r\n');
  assert.equal(data[0].nome,'Ana, Maria');
  assert.equal(data[0].descricao,'Duas\nlinhas');
});
test('JSON para CSV mantém colunas e neutraliza fórmulas',()=>{
  const data=jsonToCsv('[{"nome":"Ana","valor":"=SUM(A1:A2)"},{"nome":"João","extra":3}]');
  assert.match(data,/nome,valor,extra/);
  assert.match(data,/'=SUM/);
});
test('CSV rejeita cabeçalhos duplicados',()=>assert.throws(()=>csvToJson('a,a\n1,2')));
