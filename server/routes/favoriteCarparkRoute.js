// favoriteCarparkRoute.js
import express from 'express';
import FavoriteCarparkService from '../services/FavoriteCarparkService.js';

const router = express.Router();
const favoriteCarparkService = new FavoriteCarparkService();

// POST /favorites
router.post('/', async (req, res) => {
  try {
    const { userId, carparkId } = req.body;

    if (!userId || !carparkId) {
      return res.status(400).json({ error: 'userId and carparkId are required' });
    }

    const result = await favoriteCarparkService.addFavorite(userId, carparkId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// GET /favorites/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await favoriteCarparkService.getFavorites(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// DELETE /favorites
router.delete('/', async (req, res) => {
  try {
    const { userId, carparkId } = req.body;

    if (!userId || !carparkId) {
      return res.status(400).json({ error: 'userId and carparkId are required' });
    }

    await favoriteCarparkService.removeFavorite(userId, carparkId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// GET /favorites/:userId/:carparkId
router.get('/:userId/:carparkId', async (req, res) => {
  try {
    const { userId, carparkId } = req.params;

    const result = await favoriteCarparkService.isFavorite(userId, carparkId);
    res.json({ isFavorite: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
});

export default router;