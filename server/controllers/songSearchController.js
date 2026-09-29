const mongoose = require('mongoose');

const Song = require('../models/Song');
const asyncHandler = require('../middleware/asyncHandler');

const searchSongs = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query q is required'
    });
  }

  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

  const searchRegex = new RegExp(q, 'i');
  const query = {
    $or: [
      { title: searchRegex },
      { artist: searchRegex },
      { album: searchRegex }
    ]
  };

  const total = await Song.countDocuments(query);
  const songs = await Song.find(query)
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

module.exports = { searchSongs };
