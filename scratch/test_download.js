import { sanitizePdfFilename, buildContentDispositionHeader } from '../src/utils/sanitizeFilename.js';
import { queryTable } from '../src/lib/supabaseContent.js';

async function testDownloadLogic() {
  console.log('--- TEST 1: Filename Sanitization ---');
  const cases = [
    { in: 'Operating Systems / Notes: Unit 1? * < > | "', expected: 'Operating - Systems - Notes - Unit 1.pdf' },
    { in: 'Data   Structures   Notes.pdf', expected: 'Data Structures Notes.pdf' },
    { in: '   Database Management Systems   ', expected: 'Database Management Systems.pdf' },
    { in: 'SPPU भाषा आणि जीवनव्यवहार Question Paper 2024 PDF', expected: 'SPPU भाषा आणि जीवनव्यवहार Question Paper 2024 PDF.pdf' },
    { in: '', fallback: 'Computer Networks', expected: 'Computer Networks.pdf' }
  ];

  cases.forEach((c, i) => {
    const result = sanitizePdfFilename(c.in, c.fallback);
    console.log(`Case ${i+1}: input='${c.in}' fallback='${c.fallback||''}' -> result='${result}'`);
  });

  console.log('\n--- TEST 2: Fetch Cloudinary PDF Notes from DB and Test Headers ---');
  const pdfNotes = await queryTable('notes', '*', { file_url: 'ilike.%cloudinary%raw%' });
  console.log(`Found ${pdfNotes.length} raw Cloudinary PDF notes in DB:`);

  pdfNotes.forEach((note, idx) => {
    const rawFilename = note.original_filename || (note.title ? `${note.title}.pdf` : 'Document.pdf');
    const sanitized = sanitizePdfFilename(rawFilename, note.title);
    const header = buildContentDispositionHeader(sanitized);

    console.log(`\n[${idx+1}] Note ID: ${note.id}`);
    console.log(`     Title: ${note.title.substring(0, 65)}...`);
    console.log(`     Raw URL: ${note.file_url}`);
    console.log(`     Download Filename: ${sanitized}`);
    console.log(`     Content-Disposition: ${header.substring(0, 90)}...`);
  });
}

testDownloadLogic().catch(console.error);
