import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = resolve(process.argv[2] || 'assets/originals');
await mkdir('public/images', { recursive: true });
// Resize only: no recoloring, retouching, cropping, background removal or generated replacements.
const jobs = [
  ['2AF1547C86FC425C436D155DE216DF8A.png', 'lyont-hero', 1120, 86],
  ['2AF1547C86FC425C436D155DE216DF8A.png', 'lyont-hero-640', 640, 84],
  ['D528851497E918A056023A4046FBC03A.png', 'lyont-avatar', 256, 90],
  ['Camera1737132422730.avif.jpeg', 'lyont-illustration', 750, 86],
  ['db1af8320d5a4bd58e9adbc6ac693c60_720.png', 'lyont-reference-clothed', 1280, 90],
  ['d18d1c15fc520d6cbfcbccdf014998b8_0.png', 'lyont-reference-natural', 1280, 90],
];
for (const [original, name, width, quality] of jobs) {
  const out = `public/images/${name}.webp`;
  await sharp(resolve(source, original)).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 }).toFile(out);
  console.log(`${out}: ${Math.round((await stat(out)).size / 1024)} KB`);
}
