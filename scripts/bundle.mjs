// Inline the whole game into a single self-contained HTML file, so it can be
// opened straight from disk or hosted anywhere without a server.
//   node scripts/bundle.mjs [outputFile]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = process.argv[2] || join(ROOT, 'dist', 'cabincraft.html');

// Dependency order — every module only imports ones above it.
const MODULES = [
  'src/textures.js',
  'src/blocks.js',
  'src/world.js',
  'src/mat4.js',
  'src/mesher.js',
  'src/room.js',
  'src/player.js',
  'src/renderer.js',
  'src/main.js',
];

/**
 * Strip local imports and export keywords so the modules concatenate into one
 * scope. `import * as B from './blocks.js'` loses its namespace object, so
 * every `B.LOG` is rewritten to the bare `LOG` the flattened scope now holds.
 */
function flatten(source) {
  let out = source;
  for (const [, alias] of source.matchAll(/^import\s+\*\s+as\s+(\w+)\s+from\s*'\.[^']*';\s*$/gm)) {
    out = out.replace(new RegExp(`\\b${alias}\\.`, 'g'), '');
  }
  return out
    .replace(/^import\s[^;]*?from\s*'\.[^']*';\s*$/gm, '')
    .replace(/^export\s*\{[^}]*\};\s*$/gm, '')
    .replace(/^export\s+(const|let|var|function|class|async)\b/gm, '$1');
}

const parts = [];
for (const file of MODULES) {
  const src = await readFile(join(ROOT, file), 'utf8');
  parts.push(`// ===== ${file} =====\n${flatten(src)}`);
}

const css = await readFile(join(ROOT, 'src', 'style.css'), 'utf8');
const html = await readFile(join(ROOT, 'index.html'), 'utf8');

// Keep only the markup between <body> and </body>, minus the module script tag.
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .trim();

const page = `<title>CabinCraft — the log-cabin room</title>
<style>
${css}
</style>
${body}
<script type="module">
${parts.join('\n\n')}
</script>
`;

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, page);
console.log(`${OUT} — ${(page.length / 1024).toFixed(0)} kB`);
