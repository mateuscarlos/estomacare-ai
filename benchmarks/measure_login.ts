import { MockLocalStorage } from './mockLocalStorage';

// Mock the global localStorage BEFORE importing the service
const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;

import { authService } from '../services/authService';

async function benchmark() {
    // Setup user
    const email = 'test@example.com';
    const password = 'password123';

    console.log('Setting up benchmark...');

    // Register first to have a user
    try {
        await authService.register('Test User', email, password);
    } catch (e) {
        console.error('Setup failed:', e);
    }

    const iterations = 5;
    console.log(`Starting benchmark with ${iterations} iterations...`);
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        await authService.login(email, password);
    }

    const end = performance.now();
    const avg = (end - start) / iterations;

    console.log(`Average login time: ${avg.toFixed(2)}ms`);
}

benchmark();
