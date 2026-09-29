const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Song = require('../models/Song');
const Playlist = require('../models/Playlist');
const asyncHandler = require('../middleware/asyncHandler');

const removeAudioFile = (audioPath) => {
  if (typeof audioPath !== 'string' || !audioPath) return;
  const audioFile = path.join(__dirname, '..', audioPath.replace(/^[/\\]+/, ''));
  if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
};

const getSongPagination = (page, limit) => {
  const parsedPage = Number(page) > 0 ? Number(page) : 1;
  const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;

  return { page: parsedPage, limit: parsedLimit };
};

const createSong = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const song = await Song.create({
    ...req.body,
    audioUrl: req.body.audioUrl || undefined,
    audioPath: req.file ? `/uploads/${req.file.filename}` : undefined,
    originalAudioName: req.file?.originalname,
    createdBy: req.user.id
  });

  return res.status(201).json({
    success: true,
    data: song
  });
});

const getSongs = asyncHandler(async (req, res) => {
  const { page, limit } = getSongPagination(req.query.page, req.query.limit);

  const total = await Song.countDocuments();
  const songs = await Song.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('createdBy', 'name email');

  return res.status(200).json({
    success: true,
    data: songs,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

const getSongById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid song ID'
    });
  }

  const song = await Song.findById(id).populate('createdBy', 'name email');

  if (!song) {
    return res.status(404).json({
      success: false,
      message: 'Song not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: song
  });
});

const updateSong = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid song ID'
    });
  }

  const song = await Song.findById(id);

  if (!song) {
    return res.status(404).json({
      success: false,
      message: 'Song not found'
    });
  }

  if (song.createdBy.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to update this song'
    });
  }

  if (req.file) {
    removeAudioFile(song.audioPath);
    song.audioPath = `/uploads/${req.file.filename}`;
    song.originalAudioName = req.file.originalname;
    song.audioUrl = undefined;
  } else if (req.body.audioUrl) {
    removeAudioFile(song.audioPath);
    song.audioPath = undefined;
    song.originalAudioName = undefined;
  }

  const allowedUpdates = ['title', 'artist', 'album', 'genre', 'duration', 'releaseYear', 'audioUrl'];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      song[field] = req.body[field];
    }
  });

  const updatedSong = await song.save();

  return res.status(200).json({
    success: true,
    data: updatedSong
  });
});

const deleteSong = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid song ID'
    });
  }

  const song = await Song.findById(id);

  if (!song) {
    return res.status(404).json({
      success: false,
      message: 'Song not found'
    });
  }

  if (song.createdBy.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to delete this song'
    });
  }

  await Playlist.updateMany({ songs: id }, { $pull: { songs: id } });
  removeAudioFile(song.audioPath);
  await Song.deleteOne({ _id: id });

  return res.status(200).json({
    success: true,
    data: { id }
  });
});

module.exports = {
  createSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong
};
