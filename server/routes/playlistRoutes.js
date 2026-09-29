const express = require('express');
const { body } = require('express-validator');

const {
  createPlaylist,
  getPlaylists,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
} = require('../controllers/playlistController');
const protect = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Playlist name is required').isLength({ max: 100 }).withMessage('Playlist name cannot exceed 100 characters'),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Playlist description cannot exceed 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
  ],
  createPlaylist
);

router.get('/', getPlaylists);
router.get('/mine', getMyPlaylists);
router.get('/:id', getPlaylistById);
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Playlist name cannot be empty').isLength({ max: 100 }).withMessage('Playlist name cannot exceed 100 characters'),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Playlist description cannot exceed 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
  ],
  updatePlaylist
);
router.delete('/:id', deletePlaylist);
router.post(
  '/:id/songs',
  [
    body('songId').notEmpty().withMessage('songId is required')
  ],
  addSongToPlaylist
);
router.delete('/:id/songs/:songId', removeSongFromPlaylist);

module.exports = router;
