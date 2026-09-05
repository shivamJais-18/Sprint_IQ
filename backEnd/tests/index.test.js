import request from 'supertest';
import assert from 'node:assert/strict';
import app from '../app.js';

describe('API Routes', function () {
  describe('GET /', function () {
    it('should return API running message', async function () {
      const response = await request(app).get('/');
      assert.equal(response.status, 200);
      assert.equal(response.text, 'API is running...');
    });
  });

  describe('GET /unknown-route', function () {
    it('should return 404 for unknown route', async function () {
      const response = await request(app).get('/unknown-route');
      assert.equal(response.status, 404);
    });
  });
});
