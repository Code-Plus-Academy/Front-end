import { GET } from '../app/api/download/[noteId]/route.js';

async function testEndpoint() {
  console.log('--- Testing GET /api/download/fe553684-b158-46ce-b0bd-1b1e24ba4363 ---');
  
  const req = new Request('http://localhost:3000/api/download/fe553684-b158-46ce-b0bd-1b1e24ba4363');
  const context = { params: Promise.resolve({ noteId: 'fe553684-b158-46ce-b0bd-1b1e24ba4363' }) };

  const response = await GET(req, context);

  console.log('Response Status:', response.status);
  console.log('Response Content-Type:', response.headers.get('content-type'));
  console.log('Response Content-Disposition:', response.headers.get('content-disposition'));
  
  if (response.status === 200) {
    const arrayBuffer = await response.arrayBuffer();
    console.log(`Streamed PDF Size: ${arrayBuffer.byteLength} bytes`);
    
    // Validate PDF magic bytes: %PDF-
    const headerBytes = String.fromCharCode(...new Uint8Array(arrayBuffer.slice(0, 5)));
    console.log(`Magic Bytes Check: "${headerBytes}" -> ${headerBytes.startsWith('%PDF') ? 'VALID PDF' : 'INVALID'}`);
  } else {
    console.error('Download failed with status:', response.status);
  }
}

testEndpoint().catch(console.error);
