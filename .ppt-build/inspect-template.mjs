import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const file = 'C:/Users/IDEAPAD GAMING/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-simple-light-mode/assets/reference.pptx';
const p = await PresentationFile.importPptx(await FileBlob.load(file));
const result = await p.inspect({ select: '$.slides[*]', include: ['id','index','layout','title','elements.id','elements.kind','elements.text','elements.position','elements.style','notes.text'] });
console.log(result.ndjson);
console.log(JSON.stringify({ masters: p.masters.items.map(m => ({id:m.id,name:m.name})), layouts: p.layouts.items.map(l => ({id:l.id,name:l.name,placeholders:l.placeholders.summary()})) }, null, 2));
