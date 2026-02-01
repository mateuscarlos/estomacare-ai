
import { performance } from 'perf_hooks';

// Simulate a large Base64 image (approx 500KB - 1MB)
const base64Image = 'a'.repeat(1024 * 1024); // 1MB string
const shortUrl = 'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/patients%2F123%2Fimage.jpg?alt=media';

const patientWithBase64 = {
  id: '123',
  name: 'Test Patient',
  photoUrl: base64Image,
  comorbidities: ['Diabetes', 'Hypertension'],
  age: 45
};

const patientWithUrl = {
  id: '123',
  name: 'Test Patient',
  photoUrl: shortUrl,
  comorbidities: ['Diabetes', 'Hypertension'],
  age: 45
};

function measureSerialization(obj: any, label: string) {
  const start = performance.now();
  // Simulate network payload preparation / Firestore serialization
  const serialized = JSON.stringify(obj);
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(4)} ms`);
  console.log(`${label} size: ${(serialized.length / 1024).toFixed(2)} KB`);
}

console.log('--- Serialization Benchmark ---');
measureSerialization(patientWithBase64, 'Base64 Image');
measureSerialization(patientWithUrl, 'Storage URL');
