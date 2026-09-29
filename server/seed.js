require('dotenv').config();

const connectDB = require('./config/db');
const Song = require('./models/Song');
const User = require('./models/User');

const sampleSongs = [
  ['vishwanath & sons', 'G.V.prakash. sublahshini', 'neno butterfly', 'Drama, Action', 3, 2025],
  ['peddi', 'A.R Rahman', 'Rai Rai Raa', 'Action, Drama, Sports', 3, 2025],
  ['paradise', 'anirudh', 'aayyasher.mp3', '', 3, 2025],
  ['Blinding Lights', 'The Weeknd', 'After Hours', 'Pop', 200, 2020],
  ['Levitating', 'Dua Lipa', 'Future Nostalgia', 'Pop', 203, 2020],
  ['As It Was', 'Harry Styles', "Harry's House", 'Pop', 167, 2022],
  ['Bad Guy', 'Billie Eilish', 'When We All Fall Asleep, Where Do We Go?', 'Pop', 194, 2019],
  ['Flowers', 'Miley Cyrus', 'Endless Summer Vacation', 'Pop', 200, 2023],
  ['Good 4 U', 'Olivia Rodrigo', 'SOUR', 'Pop Rock', 178, 2021],
  ['Stay', 'The Kid LAROI and Justin Bieber', 'F*CK LOVE 3', 'Pop', 141, 2021],
  ['Heat Waves', 'Glass Animals', 'Dreamland', 'Indie Pop', 238, 2020],
  ['Save Your Tears', 'The Weeknd', 'After Hours', 'Pop', 216, 2020],
  ['Shivers', 'Ed Sheeran', '=', 'Pop', 207, 2021]
].map(([title, artist, album, genre, duration, releaseYear], index) => ({
  title,
  artist,
  album,
  genre,
  duration,
  releaseYear,
  createdAt: new Date(Date.now() - index * 1000),
  updatedAt: new Date(Date.now() - index * 1000)
}));

const seed = async () => {
  await connectDB();

  let seedUser = await User.findOne({ email: 'seed@example.com' }).select('+password');

  if (!seedUser) {
    seedUser = new User({
      name: 'Seed User',
      email: 'seed@example.com',
      password: 'seed-password'
    });
  } else {
    seedUser.password = 'seed-password';
  }

  await seedUser.save();

  await Song.deleteMany({ createdBy: seedUser._id });
  await Song.insertMany(sampleSongs.map((song) => ({ ...song, createdBy: seedUser._id })));

  console.log('Inserted 10 sample songs');
};

seed()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
  });