import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import ejs from "ejs";

const dist = new URL("../dist/", import.meta.url);
const pages = [
  { name: "index", title: "Chapitres de l'Avent", titleKey: "title.home" },
  { name: "manual", title: "Saisie manuelle | Chapitres de l'Avent", titleKey: "title.manual" },
  { name: "preview", title: "Aperçu du découpage | Chapitres de l'Avent", titleKey: "title.preview" },
  { name: "epub", title: "Découpage EPUB | Chapitres de l'Avent", titleKey: "title.epub" },
];

await rm(dist, { recursive: true, force: true });
await mkdir(new URL("styles/", dist), { recursive: true });
await mkdir(new URL("assets/", dist), { recursive: true });
await mkdir(new URL("scripts/", dist), { recursive: true });
await mkdir(new URL("scripts/domain/data/models/", dist), { recursive: true });
await mkdir(new URL("scripts/domain/services/calculation/", dist), { recursive: true });
await mkdir(new URL("scripts/domain/services/epub/", dist), { recursive: true });

for (const page of pages) {
  const html = await ejs.renderFile(
    new URL(`../src/views/${page.name}.ejs`, import.meta.url).pathname,
    { title: page.title, titleKey: page.titleKey },
    { filename: new URL(`../src/views/layout.ejs`, import.meta.url).pathname },
  );
  await writeFile(new URL(`${page.name}.html`, dist), html);
}

await cp(new URL("../public/styles/", import.meta.url), new URL("styles/", dist), {
  recursive: true,
});
await cp(new URL("../public/assets/", import.meta.url), new URL("assets/", dist), {
  recursive: true,
});
await cp(new URL("../public/scripts/", import.meta.url), new URL("scripts/", dist), {
  recursive: true,
});
await cp(new URL("../src/data/models/", import.meta.url), new URL("scripts/domain/data/models/", dist), {
  recursive: true,
});
await cp(new URL("../src/services/calculation/", import.meta.url), new URL("scripts/domain/services/calculation/", dist), {
  recursive: true,
});
await cp(new URL("../src/services/epub/", import.meta.url), new URL("scripts/domain/services/epub/", dist), {
  recursive: true,
});
await cp(new URL("../src/services/manual-input.js", import.meta.url), new URL("scripts/domain/services/manual-input.js", dist));
