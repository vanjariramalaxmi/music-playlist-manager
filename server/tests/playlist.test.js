const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const User = require('../models/User');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');

jest.setTimeout(120000);

let mongoServer;
let ownerToken;
let otherToken;
let songId;
let playlistId;

const register = async (name, email) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'secret123' });
  return response.body.data.token;
};

describe('Playlist API', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongoServer.getUri('music_playlist_manager'));
    await User.deleteMany({});
    await Song.deleteMany({});
    await Playlist.deleteMany({});

    ownerToken = await register('Playlist Owner', 'playlist-owner@example.com');
    otherToken = await register('Playlist Viewer', 'playlist-viewer@example.com');

    const owner = await User.findOne({ email: 'playlist-owner@example.com' });
    const song = await Song.create({
      title: 'Test Track',
      artist: 'Test Artist',
      duration: 125,
      createdBy: owner._id
    });
    songId = song._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('creates a playlist and returns populated songs', async () => {
    const response = await request(app)
      .post('/api/playlists')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Playlist', description: 'A test collection', isPublic: false });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Playlist');
    expect(response.body.data.songs).toEqual([]);
    playlistId = response.body.data._id;
  });

  it('adds a song once and prevents duplicate songs', async () => {
    const first = await request(app)
      .post(`/api/playlists/${playlistId}/songs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ songId });
    const second = await request(app)
      .post(`/api/playlists/${playlistId}/songs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ songId });

    expect(first.statusCode).toBe(200);
    expect(first.body.data.songs).toHaveLength(1);
    expect(first.body.data.songs[0].title).toBe('Test Track');
    expect(second.statusCode).toBe(200);
    expect(second.body.data.songs).toHaveLength(1);
  });

  it('lists only the owner playlists from /mine', async () => {
    const response = await request(app)
      .get('/api/playlists/mine')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(playlistId);
  });

  it('rejects playlist updates from a non-owner', async () => {
    const response = await request(app)
      .put(`/api/playlists/${playlistId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Unauthorized edit' });

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('removes a song without a page reload at the API level', async () => {
    const response = await request(app)
      .delete(`/api/playlists/${playlistId}/songs/${songId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.songs).toHaveLength(0);
  });

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, process.env.JWT_SECRET, { expiresIn: -1 });
    const response = await request(app)
      .get('/api/playlists/mine')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toMatch(/invalid token/i);
  });
});
