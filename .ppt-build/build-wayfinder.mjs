import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';

const SKILL_DIR = 'C:/Users/IDEAPAD GAMING/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations';
const workspaceDir = 'C:/Users/IDEAPAD GAMING/OneDrive/Documents/WayFinder';
const buildDir = path.join(workspaceDir, '.ppt-build');
const sourceTemplatePath = 'C:/Users/IDEAPAD GAMING/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-simple-light-mode/assets/reference.pptx';
const FINAL_PPTX = path.join(workspaceDir, 'deliverables', 'WayFinder_Project_Presentation_Final_v3.pptx');
const RUNTIME_PYTHON = 'C:/Users/IDEAPAD GAMING/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const candidatePath = path.join(buildDir, 'wayfinder-candidate-final-v3.pptx');

await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourceTemplatePath));

// Reuse the actual template slides that best match the required presentation sections.
presentation.slides.keep([0, 3, 4, 5, 6, 10, 12, 16, 17, 9, 13, 25]);

async function slideInfo(index) {
  const result = await presentation.inspect({
    select: `$.slides[${index}]`,
    include: ['id', 'index', 'elements.id', 'elements.kind', 'elements.text', 'elements.position'],
  });
  return result.records[0];
}

async function replaceTextboxes(index, copy) {
  const info = await slideInfo(index);
  const textboxes = info.elements
    .filter((element) => element.kind === 'textbox')
    .sort((a, b) => (a.position.top - b.position.top) || (a.position.left - b.position.left));
  for (const element of textboxes) presentation.resolve(element.id).text = '';
  copy.forEach((text, itemIndex) => {
    if (textboxes[itemIndex]) presentation.resolve(textboxes[itemIndex].id).text = text;
  });
}

function addBody(slide, text, left, top, width, height, fontSize = 22) {
  const box = slide.shapes.add({
    geometry: 'textbox', position: { left, top, width, height }, fill: 'none', line: { fill: 'none', width: 0 },
  });
  box.text = text;
  box.text.style = { typeface: 'Helvetica Neue', fontSize, color: '#000000', autoFit: 'shrinkText' };
  return box;
}

function addFlowBox(slide, text, left, top, width = 205, height = 105) {
  const shape = slide.shapes.add({
    geometry: 'roundRect', position: { left, top, width, height }, fill: '#E7F0FF',
    line: { style: 'solid', fill: '#000000', width: 1 }, borderRadius: 'rounded-xl',
  });
  shape.text = text;
  shape.text.style = { typeface: 'Helvetica Neue', fontSize: 20, bold: true, color: '#000000', alignment: 'center', autoFit: 'shrinkText' };
  return shape;
}

// 1. Title
await replaceTextboxes(0, [
  'B.Tech Project Presentation 2026',
  'WayFinder',
  'Campus Navigation Guide\nProject Title Finalisation\nPresented by: Project Team',
]);

// 2. Introduction
await replaceTextboxes(1, [
  'Introduction',
  'Why campus navigation is difficult\n\n• New students and visitors do not know where buildings are located\n• Asking for directions takes time and creates confusion\n• Important details such as timings are scattered',
  'How WayFinder helps\n\n• Search a place by name or category\n• View campus locations on an interactive map\n• Receive a simple walking route to the destination',
  '2',
]);

// 3. Title finalisation
{
  const info = await slideInfo(2);
  const slide = presentation.slides.getItem(2);
  for (const element of info.elements) {
    const keep = element.kind === 'textbox' && (element.position.top < 100 || element.position.top > 640);
    if (!keep) presentation.delete(element.id);
  }
  const remaining = await slideInfo(2);
  const title = remaining.elements.filter((e) => e.kind === 'textbox').sort((a,b) => a.position.top - b.position.top)[0];
  presentation.resolve(title.id).text = 'Project Title Finalisation';
  addBody(slide, 'Why “WayFinder – Campus Navigation Guide”\n\n• “WayFinder” clearly describes the purpose of guiding users\n• “Campus Navigation Guide” defines the project scope\n• The title is short, easy to remember, and suitable for a college project', 90, 210, 500, 300, 24);
  addBody(slide, 'Project focus\n\nCampus locations, search, map-based discovery, and simple navigation directions for students, parents, faculty, and visitors.', 690, 210, 430, 260, 24);
}

// 4. Literature survey / existing system
await replaceTextboxes(3, [
  'Literature Survey and Existing System',
  'Common approaches\n\n• Printed campus maps\n• Static map images on websites\n• General navigation applications',
  'Observed limitations\n\n• Printed maps become outdated\n• Static images cannot filter or search locations\n• General maps often miss campus-specific facilities and timings',
  'Our learning\n\nA campus guide should combine location data, search, map markers, and easy directions in one place',
  '4',
]);

// 5. Objectives
await replaceTextboxes(4, [
  'Objectives',
  'Location discovery\n\nHelp users find important campus places quickly',
  'Interactive map\n\nShow buildings with markers and clear details',
  'Simple navigation\n\nGenerate distance, walking time, and written steps',
  '5',
]);

// 6. Problem statement
{
  const info = await slideInfo(5);
  const slide = presentation.slides.getItem(5);
  for (const element of info.elements) {
    const keep = element.kind === 'textbox' && (element.position.top < 100 || element.position.top > 640);
    if (!keep) presentation.delete(element.id);
  }
  const remaining = await slideInfo(5);
  const title = remaining.elements.filter((e) => e.kind === 'textbox').sort((a,b) => a.position.top - b.position.top)[0];
  presentation.resolve(title.id).text = 'Problem Statement';
  addBody(slide, 'Users\n\nNew students, parents, visitors, faculty, and event participants need quick guidance.', 60, 240, 330, 220, 22);
  addBody(slide, 'Challenge\n\nCampus information is hard to find when maps are incomplete or directions depend on asking others.', 455, 240, 330, 220, 22);
  addBody(slide, 'Need\n\nA simple web application that finds a place, shows it on a map, and gives navigation guidance.', 850, 240, 330, 220, 22);
}

// 7. Proposed system
{
  const info = await slideInfo(6);
  const slide = presentation.slides.getItem(6);
  for (const element of info.elements) {
    const keep = element.kind === 'textbox' && (element.position.top < 100 || element.position.top > 640);
    if (!keep) presentation.delete(element.id);
  }
  const remaining = await slideInfo(6);
  const title = remaining.elements.filter((e) => e.kind === 'textbox').sort((a,b) => a.position.top - b.position.top)[0];
  presentation.resolve(title.id).text = 'Proposed System';
  addBody(slide, 'Frontend\n\n• React and Vite interface\n• Leaflet map with OpenStreetMap tiles\n• Search, filters, route display, and toast notifications', 110, 220, 420, 260, 24);
  addBody(slide, 'Backend\n\n• FastAPI REST APIs\n• SQLite database for locations and contact messages\n• SQLAlchemy models with request validation', 710, 220, 420, 260, 24);
  addBody(slide, 'Key features: location details, category filtering, walking estimate, and contact form', 110, 540, 1000, 45, 21);
}

// 8. Methodology: retain template header/footer, replace content with an editable flow diagram.
{
  const info = await slideInfo(7);
  const slide = presentation.slides.getItem(7);
  for (const element of info.elements) {
    const isHeaderOrFooter = element.kind === 'textbox' && (element.position.top < 150 || element.position.top > 640);
    if (!isHeaderOrFooter) presentation.delete(element.id);
  }
  const header = (await slideInfo(7)).elements.filter((e) => e.kind === 'textbox').sort((a,b) => a.position.top - b.position.top)[0];
  presentation.resolve(header.id).text = 'Methodology';
  const steps = [
    addFlowBox(slide, '1. Collect campus location details', 54, 265),
    addFlowBox(slide, '2. Store data in SQLite', 305, 265),
    addFlowBox(slide, '3. Serve data through FastAPI', 556, 265),
    addFlowBox(slide, '4. Display map and route in React', 807, 265),
  ];
  for (let i = 0; i < steps.length - 1; i++) {
    slide.shapes.connect(steps[i], steps[i + 1], { kind: 'straight', fromSide: 'right', toSide: 'left', line: { style: 'solid', fill: '#000000', width: 2 }, head: { type: 'arrow', width: 'med', length: 'med' } });
  }
  addBody(slide, 'The development approach keeps the project modular: the frontend consumes REST APIs, and the backend manages location and contact data.', 80, 440, 1090, 80, 21);
}

// 9. Expected outcomes
{
  const info = await slideInfo(8);
  const slide = presentation.slides.getItem(8);
  for (const element of info.elements) {
    const keep = element.kind === 'textbox' && (element.position.top < 100 || element.position.top > 640);
    if (!keep) presentation.delete(element.id);
  }
  const remaining = await slideInfo(8);
  const title = remaining.elements.filter((e) => e.kind === 'textbox').sort((a,b) => a.position.top - b.position.top)[0];
  presentation.resolve(title.id).text = 'Expected Outcomes';
  addBody(slide, 'Fast search\n\nUsers can locate Library, Hostel, Canteen, Parking, and other key places.', 70, 250, 330, 190, 23);
  addBody(slide, 'Clear map view\n\nMarkers and popups make the campus easier to understand.', 455, 250, 330, 190, 23);
  addBody(slide, 'Simple route guidance\n\nUsers see distance, estimated walking time, and written directions.', 840, 250, 330, 190, 23);
}

// 10. Future scope
{
  const info = await slideInfo(9);
  const slide = presentation.slides.getItem(9);
  for (const element of info.elements) {
    const keep = element.kind === 'textbox' && (element.position.top < 100 || element.position.top > 640);
    if (!keep) presentation.delete(element.id);
  }
  const remaining = await slideInfo(9);
  const title = remaining.elements.filter((e) => e.kind === 'textbox').sort((a,b) => a.position.top - b.position.top)[0];
  presentation.resolve(title.id).text = 'Future Scope';
  addBody(slide, 'Live location\n\nUse the device location to show the user’s current position.\n\nStudent login\n\nSave favourite places and frequently used routes.', 110, 210, 430, 310, 23);
  addBody(slide, 'Accessible routes\n\nAdd wheelchair-friendly paths and accessibility information.\n\nCampus updates\n\nAllow staff to update events, closures, and building timings.', 690, 210, 430, 310, 23);
}

// 11. References
{
  const info = await slideInfo(10);
  const slide = presentation.slides.getItem(10);
  for (const element of info.elements) {
    const keep = element.kind === 'textbox' && (element.position.top < 150 || element.position.top > 640);
    if (!keep) presentation.delete(element.id);
  }
  const remaining = await slideInfo(10);
  const title = remaining.elements.filter((e) => e.kind === 'textbox').sort((a,b) => a.position.top - b.position.top)[0];
  presentation.resolve(title.id).text = 'References';
  addBody(slide, '• React Documentation — https://react.dev\n\n• FastAPI Documentation — https://fastapi.tiangolo.com\n\n• Leaflet Documentation — https://leafletjs.com\n\n• OpenStreetMap — https://www.openstreetmap.org\n\n• SQLAlchemy Documentation — https://docs.sqlalchemy.org', 90, 190, 1050, 360, 24);
}

// 12. Close
await replaceTextboxes(11, [
  'Project Title Finalisation',
  'Thank you',
  'WayFinder – Campus Navigation Guide\nQuestions and feedback',
]);

for (let i = 0; i < presentation.slides.items.length; i++) {
  presentation.slides.getItem(i).speakerNotes.text = `WayFinder project presentation, slide ${i + 1}.`;
}

await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const sourceSha = crypto.createHash('sha256').update(await fs.readFile(sourceTemplatePath)).digest('hex');
const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, 'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({
  explicitTotalSlideCount: 12,
  sourceTemplatePath,
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-bullet-geometry', '--validate-heading-fit'],
  fontPolicy: { basis: 'reference', families: ['Helvetica Neue', 'Helvetica Neue Medium'], referencePath: sourceTemplatePath, referenceSha256: sourceSha },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, 'wayfinder-final-v3-validation.json'),
});
