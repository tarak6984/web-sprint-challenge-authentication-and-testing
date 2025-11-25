const request = require('supertest');
const server = require('./server');
const db = require('../data/dbConfig');

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  await db('users').truncate();
});

describe('[POST] /api/auth/register', () => {
  test('creates a new user with hashed password', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('password');
    expect(res.body.password).not.toBe('password123');
  });

  test('returns error when username or password is missing', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ username: 'testuser' });
    expect(res.status).toBe(400);
    expect(res.body).toBe('username and password required');
  });

  test('returns error when username already exists', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    const res = await request(server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password456' });
    expect(res.status).toBe(400);
    expect(res.body).toBe('username taken');
  });
});

describe('[POST] /api/auth/login', () => {
  beforeEach(async () => {
    await request(server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
  });

  test('returns token and welcome message on valid credentials', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'welcome, testuser');
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  test('returns error when username or password is missing', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: 'testuser' });
    expect(res.status).toBe(400);
    expect(res.body).toBe('username and password required');
  });

  test('returns error on invalid credentials', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toBe('invalid credentials');
  });

  test('returns error on non-existent username', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body).toBe('invalid credentials');
  });
});

describe('[GET] /api/jokes', () => {
  test('returns error when no token is provided', async () => {
    const res = await request(server).get('/api/jokes');
    expect(res.status).toBe(401);
    expect(res.body).toBe('token required');
  });

  test('returns error when invalid token is provided', async () => {
    const res = await request(server)
      .get('/api/jokes')
      .set('Authorization', 'invalid-token');
    expect(res.status).toBe(401);
    expect(res.body).toBe('token invalid');
  });

  test('returns jokes when valid token is provided', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });
    
    const token = loginRes.body.token;
    
    const res = await request(server)
      .get('/api/jokes')
      .set('Authorization', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
})
