const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const User = require('../models/User');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');

jest.setTimeout(120000);

let mongoServer;
let user1Token;
let user2Token;
let songId;

const createToken = async (email, password, name) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });

  return res.body.data.token;
};

describe('Song API', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongoServer.getUri('music_playlist_manager'));
    await User.deleteMany({});
    await Song.deleteMany({});
    await Playlist.deleteMany({});

    user1Token = await createToken('songowner@example.com', 'secret123', 'Song Owner');
    user2Token = await createToken('songother@example.com', 'secret123', 'Other User');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('creates a song for the logged-in user', async () => {
    const res = await request(app)
      .post('/api/songs')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Midnight City',
        artist: 'M83',
        album: 'Hurry Up, We’re Dreaming',
        genre: 'Synthwave',
        duration: 240,
        releaseYear: 2011
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Midnight City');
    songId = res.body.data._id;
  });

  it('lists songs with pagination', async () => {
    const res = await request(app)
      .get('/api/songs?page=1&limit=10')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.total).toBe(1);
  });

  it('gets a single song by id', async () => {
    const res = await request(app)
      .get(`/api/songs/${songId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Midnight City');
  });

  it('updates only the owner song', async () => {
    const res = await request(app)
      .put(`/api/songs/${songId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Midnight City (Remix)' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Midnight City (Remix)');
  });

  it('rejects updates from another user with 403', async () => {
    const res = await request(app)
      .put(`/api/songs/${songId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Hacked title' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('removes the song from playlists on delete', async () => {
    const playlist = await Playlist.create({
      name: 'Synth Favorites',
      owner: (await User.findOne({ email: 'songowner@example.com' }))._id,
      songs: [songId]
    });

    const res = await request(app)
      .delete(`/api/songs/${songId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const refreshedPlaylist = await Playlist.findById(playlist._id);
    expect(refreshedPlaylist.songs).toEqual([]);
  });

  it('returns 400 for invalid song id format', async () => {
    const res = await request(app)
      .get('/api/songs/not-a-valid-id')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
