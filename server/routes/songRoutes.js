const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const {
  createSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong
} = require('../controllers/songController');
const { searchSongs } = require('../controllers/songSearchController');
const protect = require('../middleware/auth');

const router = express.Router();

const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
      const safeName = path.basename(file.originalname).replace(/[^a-z0-9.-]/gi, '-');
      callback(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const isMp3 = file.mimetype === 'audio/mpeg' || file.originalname.toLowerCase().endsWith('.mp3');
    callback(isMp3 ? null : new Error('Only MP3 audio files are supported.'), isMp3);
  }
});

router.use(protect);

router.get('/search', searchSongs);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('artist').trim().notEmpty().withMessage('Artist is required').isLength({ max: 200 }).withMessage('Artist cannot exceed 200 characters'),
    body('album').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Album cannot exceed 200 characters'),
    body('genre').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Genre cannot exceed 100 characters'),
    body('duration')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Duration must be a number greater than or equal to 0'),
    body('releaseYear')
      .optional()
      .isInt({ min: 1800, max: 2100 })
      .withMessage('Release year must be a valid year'),
    body('audioUrl')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Audio URL must be a valid http or https URL')
  ],
  upload.single('audioFile'),
  createSong
);

router.get('/', getSongs);
router.get('/:id', getSongById);
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('artist').optional().trim().notEmpty().withMessage('Artist cannot be empty').isLength({ max: 200 }).withMessage('Artist cannot exceed 200 characters'),
    body('album').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Album cannot exceed 200 characters'),
    body('genre').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Genre cannot exceed 100 characters'),
    body('duration')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Duration must be a number greater than or equal to 0'),
    body('releaseYear')
      .optional()
      .isInt({ min: 1800, max: 2100 })
      .withMessage('Release year must be a valid year'),
    body('audioUrl')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Audio URL must be a valid http or https URL')
  ],
  upload.single('audioFile'),
  updateSong
);
router.delete('/:id', deleteSong);

module.exports = router;
