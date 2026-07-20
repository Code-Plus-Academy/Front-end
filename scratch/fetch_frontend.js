async function run() {
  try {
    const res = await fetch('http://localhost:3000/notes/resource/sfsd-55333412');
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Contains Atharva Kapse:', text.includes('Atharva Kapse'));
    console.log('Contains Deleted Contributor:', text.includes('Deleted Contributor'));
    console.log('Contains CPA Contributor:', text.includes('CPA Contributor'));
  } catch (err) {
    console.error('Error fetching frontend:', err);
  }
}
run();
