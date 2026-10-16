import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Health and API Base Endpoints', () => {
  it('GET /api returns basic API information', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'IssuePilot API');
    expect(res.body).toHaveProperty('tagline');
  });

  it('GET /api/health reports operational status and database connection', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body.services).toHaveProperty('api', 'operational');
    expect(res.body.services.database.status).toBe('connected');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });
});
