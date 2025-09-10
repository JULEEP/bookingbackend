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
  addTeamToBooking
} from '../controllers/userController.js';
import { uploadProfileImage } from '../config/multerConfig.js';

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
router.post('/createteam/:matchId', createTeam);
router.put("/add-team/:userId/:bookingId", addTeamToBooking);
export default router;
