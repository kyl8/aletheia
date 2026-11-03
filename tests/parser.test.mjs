import test from 'node:test';
import assert from 'node:assert/strict';
import {parseResumeText,normalizeResumeData} from '../src/lib/cv/parser.ts';

test('extrai dados básicos sem inventar seções',()=>{
  const c=parseResumeText('Maria Silva\nmaria@example.com\n(11) 99999-9999\nSão Paulo - SP\n\nResumo profissional\nAnalista de dados com experiência em SQL.');
  assert.equal(c.nome,'Maria Silva');
  assert.equal(c.email,'maria@example.com');
  assert.match(c.telefone,/99999/);
  assert.match(c.resumo,/Analista/);
  assert.equal(c.experiencias.length,0);
});
test('separa experiências, formação, habilidades e projetos',()=>{
  const c=parseResumeText('João Teste\nExperiência Profissional\nEngenheiro de Software | Empresa X\n2022 - 2024\n- Desenvolvimento de APIs\n\nFormação Acadêmica\nCiência de Dados | Fatec\n2021 - 2024\n\nHabilidades\nLinguagens: TypeScript, Python\nProjetos\nConversor de arquivos');
  assert.equal(c.experiencias.length,1);
  assert.equal(c.formacao.length,1);
  assert.equal(c.habilidades[0].categoria,'Linguagens');
  assert.equal(c.secoes[0].titulo,'Projetos');
});
test('normalização segura não confia em JSON de IA',()=>{
  const c=normalizeResumeData({nome:'Ana',experiencias:'unexpected',habilidades:[null,{categoria:'Backend',itens:'Rust'}]});
  assert.equal(c.nome,'Ana');
  assert.equal(c.experiencias.length,0);
  assert.equal(c.habilidades[0].categoria,'');
  assert.equal(c.habilidades[1].itens,'Rust');
});
