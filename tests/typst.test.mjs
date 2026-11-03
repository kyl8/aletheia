import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeTypst,generateTypstSource} from '../src/lib/cv/typst.ts';
import {createEmptyResume} from '../src/lib/cv/types.ts';
test('escapa caracteres especiais para evitar markup acidental',()=>{
  assert.equal(escapeTypst('Ana #1 [CV]'), 'Ana \\#1 \\[CV\\]');
});
test('gerador inclui seções relevantes sem inventar dados',()=>{
  const cv=createEmptyResume();cv.nome='Ana Silva';cv.resumo='Engenheira de software';
  const source=generateTypstSource(cv);
  assert.match(source,/Ana Silva/);
  assert.match(source,/Resumo profissional/);
  assert.doesNotMatch(source,/Experiência profissional/);
});
