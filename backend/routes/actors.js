import express from 'express';
import { parseId, route } from '../lib/http.js';
import { getCatalog, toListItem } from '../services/catalog.js';

const router = express.Router();

router.get(
  '/:actorId',
  route(async (req, res) => {
    const { actors, byId } = await getCatalog();
    const actor = actors.get(parseId(req.params.actorId));
    if (!actor) {
      return res.status(404).json({ message: 'Actor not found' });
    }
    const movies = actor.movieIds
      .map((id) => byId.get(id))
      .sort((a, b) => b.release_date.localeCompare(a.release_date))
      .map((movie) => toListItem(movie));
    res.json({
      id_actor: actor.id_actor,
      actor_name: actor.actor_name,
      image: actor.image,
      movies,
    });
  })
);

export default router;
