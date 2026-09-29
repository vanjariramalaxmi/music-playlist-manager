const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    artist: {
      type: String,
      required: [true, 'Artist is required'],
      trim: true,
      maxlength: [200, 'Artist cannot exceed 200 characters']
    },
    album: {
      type: String,
      trim: true,
      maxlength: [200, 'Album cannot exceed 200 characters']
    },
    genre: {
      type: String,
      trim: true,
      maxlength: [100, 'Genre cannot exceed 100 characters']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    releaseYear: {
      type: Number
    },
    audioUrl: {
      type: String,
      trim: true
    },
    audioPath: {
      type: String,
      trim: true
    },
    originalAudioName: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Song creator is required']
    }
  },
  { timestamps: true }
);

songSchema.index({ title: 'text', artist: 'text', album: 'text' });

module.exports = mongoose.model('Song', songSchema);