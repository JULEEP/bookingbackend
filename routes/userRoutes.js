import express from 'express';
import {
  register,
  login,
  verifyOTP,
  updateUserProfile,
  getUserProfile,
  addUserLocation,
  getNearbyTurfs,
  getNearbyTurfsAndSingleTurf,
  updateUserProfileImage,
  updateUserContactInfo,
  bookTurfSlot,
  getUserTurfBookings,
  getUserNotifications,
  bookTournamentSlot,
  getMyTournamentBookings,
  createTeam,
  createMatch,
  startMatch,
  getAllMatches,
  getSingleMatch,
  getAllTeams,
  searchUsers,
  createTournament,
  getAllTournaments,
  addTeamToTournament,
  getTeamsByTournament,
  getSingleMatchById,
  updateLiveScore,
  createTeamWithCategory,
  getAllGamesTeams,
  getTeamsByCategory,
  createMatchForGame,
  startGameMatch,
  updateFootballMatchStatus,
  getSingleGameMatch,
  getAllGameMatches,
  createGameMatchforFootball,
  getSingleGameMatches,
  updateMatchScore
} from '../controllers/userController.js';
import { uploadProfileImage } from '../config/multerConfig.js';
import { getTournamentTeams } from '../controllers/turnamentController.js';

const router = express.Router();

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Update profile
router.put('/updateprofile/:userId', updateUserProfile);
router.get('/userprofile/:userId', getUserProfile);
router.put("/addlocation/:userId", addUserLocation);
router.get("/nearby-turfs/:userId", getNearbyTurfs);
// Route expects both userId and turfId (turfId optional)
router.get("/nearby-turf/:userId/:turfId", getNearbyTurfsAndSingleTurf);
router.put('/profile-image/:userId', uploadProfileImage.single('profileImage'), updateUserProfileImage);
router.put('/update-info/:userId', updateUserContactInfo);
router.post('/book-turf-slot', bookTurfSlot);
router.post('/book-turnament-slot', bookTournamentSlot);
router.get('/myturfbookings/:userId', getUserTurfBookings);
router.get('/mytournamentbookings/:userId', getMyTournamentBookings);
router.get('/mynotifications/:userId', getUserNotifications);
router.post('/createteams/:userId', createTeam);
router.get('/allteams', getAllTeams);
router.post("/creatematch/:userId", createMatch);
router.get("/tournamentsteams/:tournamentId", getTournamentTeams);
router.post("/startmatch/:userId/:matchId", startMatch);
router.get("/getmatches", getAllMatches);
router.get("/singlematch/:userId/:matchId", getSingleMatch);
router.get("/searchusers", searchUsers);
router.post('/createtournaments/:userId', createTournament);
router.get('/alltournaments', getAllTournaments);
router.post("/addteamtournaments/:userId", addTeamToTournament);
router.get('/tournamentsteams/:tournamentId', getTeamsByTournament);
router.get('/getsinglematch/:id', getSingleMatchById);
router.put('/updatematch/:id', updateLiveScore);
router.post('/creategameteams/:userId', createTeamWithCategory);
router.get('/allgamesteam', getAllGamesTeams);
router.get('/getteambycat/:categoryId', getTeamsByCategory);
router.post('/creategamematch/:userId', createMatchForGame);
router.post('/startgamematch/:userId/:matchId', startGameMatch);
router.put("/footballstatus/:userId/:matchId" ,updateFootballMatchStatus);
router.get('/getsingle/:matchId', getSingleGameMatch);
router.get('/gamematches', getAllGameMatches);
router.post('/creatematchforfootball/:userId', createGameMatchforFootball);
router.get('/getsinglegamematch/:matchId', getSingleGameMatches);
router.put('/update-score/:matchId', updateMatchScore);










export default router;
