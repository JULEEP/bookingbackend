import express from 'express';
import { createTournament, deleteTournament, getAllTournaments, getSingleTournament, getUpcomingTournament, updateTournament } from '../controllers/turnamentController.js';
import { uploadTournamentImage } from '../config/multerConfig.js';

const router = express.Router();

router.post('/create-tournament', uploadTournamentImage.single('image'), createTournament);
router.put('/update-tournament/:id', uploadTournamentImage.single('image'), updateTournament);
router.delete('/delete-tournament/:id', deleteTournament);
router.get('/gettournaments', getAllTournaments);
router.get('/getuncomingturnaments', getUpcomingTournament);
router.get('/singletournament/:tournamentId', getSingleTournament);

export default router;
