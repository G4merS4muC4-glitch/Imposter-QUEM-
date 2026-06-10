// Converte lib/words.ts (fonte da verdade do app) para o literal JS
// dentro de web/index.html. Roda com: node tools/port-words.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wordsTs = readFileSync(join(root, 'lib', 'words.ts'), 'utf8');
const htmlPath = join(root, 'web', 'index.html');
let html = readFileSync(htmlPath, 'utf8');

// Extrai o array do TS: do "export const CATEGORIES" até o último "];"
const startMarker = 'export const CATEGORIES: Category[] = [';
const start = wordsTs.indexOf(startMarker);
if (start === -1) throw new Error('CATEGORIES não encontrado em words.ts');
const arrStart = start + startMarker.length - 1; // inclui o [
const end = wordsTs.lastIndexOf('];');
if (end === -1) throw new Error('fim do array não encontrado');
const arrSrc = wordsTs.slice(arrStart, end + 1);

// O corpo do array é JS válido (objetos literais sem tipos) — eval controlado
const CATEGORIES = new Function(`return ${arrSrc};`)();

// Sanity checks
if (!Array.isArray(CATEGORIES) || CATEGORIES.length < 15) {
  throw new Error(`esperava 15+ categorias, veio ${CATEGORIES.length}`);
}
let total = 0;
for (const c of CATEGORIES) {
  if (!c.id || !c.emoji || !c.name || !Array.isArray(c.words) || c.words.length < 15) {
    throw new Error(`categoria inválida: ${JSON.stringify(c).slice(0, 80)}`);
  }
  for (const w of c.words) {
    if (!w.w || !w.hint || !w.hintHard) throw new Error(`palavra inválida em ${c.id}`);
  }
  total += c.words.length;
}

// Gera literal compacto: uma linha por palavra
const lines = ['const CATEGORIES = ['];
for (const c of CATEGORIES) {
  lines.push(`  { id:${JSON.stringify(c.id)}, emoji:${JSON.stringify(c.emoji)}, name:${JSON.stringify(c.name)}, words:[`);
  for (const w of c.words) {
    lines.push(`    {w:${JSON.stringify(w.w)},hint:${JSON.stringify(w.hint)},hintHard:${JSON.stringify(w.hintHard)}},`);
  }
  lines.push('  ]},');
}
lines.push('];');
const generated = lines.join('\n');

// Substitui o bloco existente no HTML (de "const CATEGORIES = [" ao "];" antes de "   2) STATE")
const blockStart = html.indexOf('const CATEGORIES = [');
if (blockStart === -1) throw new Error('CATEGORIES não encontrado no HTML');
const afterBlock = html.indexOf('/* ============================================================\n   2) STATE', blockStart);
if (afterBlock === -1) throw new Error('marcador de STATE não encontrado no HTML');
const blockEnd = html.lastIndexOf('];', afterBlock);
if (blockEnd === -1 || blockEnd < blockStart) throw new Error('fim do bloco CATEGORIES não encontrado');

html = html.slice(0, blockStart) + generated + html.slice(blockEnd + 2);
writeFileSync(htmlPath, html, 'utf8');
console.log(`OK: ${CATEGORIES.length} categorias, ${total} palavras portadas pro web/index.html`);
