import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const p = await PresentationFile.importPptx(await FileBlob.load('C:/Users/IDEAPAD GAMING/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-simple-light-mode/assets/reference.pptx'));
const r = await p.inspect({select:'$.slides[*]',include:['index','title','elements.kind','elements.text','elements.position']});
for (const s of r.records) console.log(`${s.index}: ${s.title} | ${s.elements?.map(e => e.kind).join(',')}`);
