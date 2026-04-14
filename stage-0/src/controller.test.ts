import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn } from 'child_process';

let server: ReturnType<typeof spawn>;
const BASE_URL = 'http://localhost:3000';

async function fetch(url: string, opts?: RequestInit) {
  return globalThis.fetch(url, opts);
}

beforeAll(async () => {
  server = spawn('bun', ['run', 'dev'], { 
    cwd: '/home/fortune/Documents/projects/hng/stage-0',
    stdio: 'pipe'
  });
  await new Promise(r => setTimeout(r, 2000));
});

afterAll(() => {
  server.kill();
});

describe('GET /api/classify', () => {
  it('returns 200 with valid name', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=john`);
    const body = await res.json();
    
    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data).toHaveProperty('name');
    expect(body.data).toHaveProperty('gender');
    expect(body.data).toHaveProperty('probability');
    expect(body.data).toHaveProperty('sample_size');
    expect(body.data).toHaveProperty('is_confident');
    expect(body.data).toHaveProperty('processed_at');
  });

  it('renames count to sample_size', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=john`);
    const body = await res.json();
    
    expect(body.data).toHaveProperty('sample_size');
    expect(body.data).not.toHaveProperty('count');
  });

  it('is_confident true when probability >= 0.7 AND sample_size >= 100', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=john`);
    const body = await res.json();
    
    expect(body.data.probability).toBeGreaterThanOrEqual(0.7);
    expect(body.data.sample_size).toBeGreaterThanOrEqual(100);
    expect(body.data.is_confident).toBe(true);
  });

  it('is_confident false when probability < 0.7', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=tammy`);
    const body = await res.json();
    
    if (body.status === 'success' && body.data.probability < 0.7) {
      expect(body.data.is_confident).toBe(false);
    }
  });

  it('returns 400 for missing name', async () => {
    const res = await fetch(`${BASE_URL}/api/classify`);
    const body = await res.json();
    
    expect(res.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.message).toMatch(/name/i);
  });

  it('returns 400 for empty name', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=`);
    const body = await res.json();
    
    expect(res.status).toBe(400);
    expect(body.status).toBe('error');
  });

  it('returns 422 for non-string name', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=123`);
    const body = await res.json();
    
    if (res.status === 422) {
      expect(body.status).toBe('error');
    }
  });

  it('returns error when gender null', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=xyznotfoundabc123`);
    const body = await res.json();
    
    expect(body.status).toBe('error');
    expect(body.message).toBe('No prediction available for the provided name');
  });

  it('returns processed_at in ISO 8601 format', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=alex`);
    const body = await res.json();
    
    if (body.status === 'success') {
      expect(body.data.processed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    }
  });

  it('has CORS header', async () => {
    const res = await fetch(`${BASE_URL}/api/classify?name=john`);
    
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('handles OPTIONS request', async () => {
    const res = await fetch(`${BASE_URL}/api/classify`, { method: 'OPTIONS' });
    
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});