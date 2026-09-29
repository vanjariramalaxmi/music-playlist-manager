const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const asyncHandler = require('../middleware/asyncHandler');

const getPaginationValues = (page, limit) => {
  const parsedPage = Number(page) > 0 ? Number(page) : 1;
  const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;

  return { page: parsedPage, limit: parsedLimit };
};

const populatePlaylist = (query) =>
  query.populate('owner', 'name email').populate('songs');

const createPlaylist = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const playlist = await Playlist.create({
    ...req.body,
    owner: req.user.id
  });

  const populatedPlaylist = await populatePlaylist(Playlist.findById(playlist._id));

  return res.status(201).json({
    success: true,
    data: populatedPlaylist
  });
});

const getPlaylists = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationValues(req.query.page, req.query.limit);

  const filter = {
    $or: [{ isPublic: true }, { owner: req.user.id }]
  };

  const total = await Playlist.countDocuments(filter);
  const playlists = await populatePlaylist(
    Playlist.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
  );

  return res.status(200).json({
    success: true,
    data: playlists,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

const getMyPlaylists = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationValues(req.query.page, req.query.limit);

  const total = await Playlist.countDocuments({ owner: req.user.id });
  const playlists = await populatePlaylist(
    Playlist.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
  );

  return res.status(200).json({
    success: true,
    data: playlists,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid playlist ID'
    });
  }

  const playlist = await populatePlaylist(Playlist.findById(id));

  if (!playlist) {
    return res.status(404).json({
      success: false,
      message: 'Playlist not found'
    });
  }

  if (!playlist.isPublic && playlist.owner._id.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to view this playlist'
    });
  }

  return res.status(200).json({
    success: true,
    data: playlist
  });
});

const updatePlaylist = asyncHandler(async (req, res) => {
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
      message: 'Invalid playlist ID'
    });
  }

  const playlist = await Playlist.findById(id);

  if (!playlist) {
    return res.status(404).json({
      success: false,
      message: 'Playlist not found'
    });
  }

  if (playlist.owner.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to update this playlist'
    });
  }

  const allowedFields = ['name', 'description', 'isPublic'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      playlist[field] = req.body[field];
    }
  });

  const updatedPlaylist = await playlist.save();
  const populatedPlaylist = await populatePlaylist(Playlist.findById(updatedPlaylist._id));

  return res.status(200).json({
    success: true,
    data: populatedPlaylist
  });
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid playlist ID'
    });
  }

  const playlist = await Playlist.findById(id);

  if (!playlist) {
    return res.status(404).json({
      success: false,
      message: 'Playlist not found'
    });
  }

  if (playlist.owner.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to delete this playlist'
    });
  }

  await Playlist.deleteOne({ _id: id });

  return res.status(200).json({
    success: true,
    data: { id }
  });
});

const addSongToPlaylist = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  const { id } = req.params;
  const { songId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(songId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid playlist or song ID'
    });
  }

  const playlist = await Playlist.findById(id);

  if (!playlist) {
    return res.status(404).json({
      success: false,
      message: 'Playlist not found'
    });
  }

  if (playlist.owner.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to modify this playlist'
    });
  }

  const song = await Song.findById(songId);

  if (!song) {
    return res.status(404).json({
      success: false,
      message: 'Song not found'
    });
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    id,
    { $addToSet: { songs: songId } },
    { new: true }
  )
    .populate('owner', 'name email')
    .populate('songs');

  return res.status(200).json({
    success: true,
    data: updatedPlaylist
  });
});

const removeSongFromPlaylist = asyncHandler(async (req, res) => {
  const { id, songId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(songId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid playlist or song ID'
    });
  }

  const playlist = await Playlist.findById(id);

  if (!playlist) {
    return res.status(404).json({
      success: false,
      message: 'Playlist not found'
    });
  }

  if (playlist.owner.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not allowed to modify this playlist'
    });
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    id,
    { $pull: { songs: songId } },
    { new: true }
  )
    .populate('owner', 'name email')
    .populate('songs');

  return res.status(200).json({
    success: true,
    data: updatedPlaylist
  });
});

module.exports = {
  createPlaylist,
  getPlaylists,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
};
