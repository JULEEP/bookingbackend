import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import Turf from '../models/Turf.js';
import Booking from '../models/Booking.js';
import Tournament from '../models/turnamentModel.js';
import Match from '../models/Match.js';
import mongoose from 'mongoose';

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, mobile, password: hashedPassword });
    await user.save();

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// // Generate a 4-digit OTP
// const generateOTP = () => {
//   return Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit OTP
// };


// Static OTP generator
const generateOTP = () => "1234";

export const login = async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Mobile number not registered' });
    }

    const otp = generateOTP(); // always "1234"
    const otpExpiration = Date.now() + 5 * 60 * 1000;

    user.otp = otp;
    user.otpExpiration = otpExpiration;
    await user.save();

    const { password, otp: _, otpExpiration: __, ...userDetails } = user.toObject();

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp, // ✅ for demo/testing only – remove in prod
      user: userDetails,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp !== "1234") {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Find user with that OTP
    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (Date.now() > user.otpExpiration) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Clear OTP after success
    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    const { password, otp: _, otpExpiration: __, ...userDetails } = user.toObject();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      user: userDetails,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { city, gender, dob } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { city, gender, dob },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const updateUserContactInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;

    // Optional: validate email or phone here if needed

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phone },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User contact info updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user contact info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Select only required fields
    const user = await User.findById(userId).select('name email mobile profileImage');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};



export const addUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "latitude and longitude are required in body" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.latitude = latitude;
    user.longitude = longitude;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User location updated successfully",
      user: {
        _id: user._id,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });
  } catch (error) {
    console.error("Error updating user location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}



export const getNearbyTurfs = async (req, res) => {
  try {
    const { userId } = req.params;
    const categoryQuery = req.query.category; // get category from query string (optional)

    // Get user location
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userLat = user.latitude;
    const userLng = user.longitude;

    if (userLat === undefined || userLng === undefined) {
      return res.status(400).json({ error: "User location not set" });
    }

    // Fetch all turfs
    const turfs = await Turf.find();

    const maxDistanceKm = 10;

    // Filter turfs based on distance and optional category name match
    const nearbyTurfs = turfs.filter(turf => {
      if (turf.latitude === undefined || turf.longitude === undefined) return false;

      // Distance check
      const distance = getDistanceFromLatLonInKm(userLat, userLng, turf.latitude, turf.longitude);
      if (distance > maxDistanceKm) return false;

      // Category filter if provided (case-insensitive match on name)
      if (categoryQuery) {
        const regex = new RegExp(categoryQuery, 'i');
        if (!regex.test(turf.name)) return false;
      }

      return true;
    });

    // Map response
    const response = nearbyTurfs.map(turf => ({
      _id: turf._id,
      name: turf.name,
      pricePerHour: turf.pricePerHour,
      location: turf.location,
      openingTime: turf.openingTime,
      images: turf.images.map(img => `/uploads/turfImg/${img}`),
    }));

    res.status(200).json({
      success: true,
      turfs: response,
    });
  } catch (error) {
    console.error("Error fetching nearby turfs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getNearbyTurfsAndSingleTurf = async (req, res) => {
  try {
    const { userId, turfId } = req.params;

    // Get user with lat/lng
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userLat = user.latitude;
    const userLng = user.longitude;

    if (userLat === undefined || userLng === undefined) {
      return res.status(400).json({ error: "User location not set" });
    }

    // Fetch all turfs
    const turfs = await Turf.find();

    // Max distance 10km
    const maxDistanceKm = 10;

    // Filter nearby turfs
    const nearbyTurfs = turfs.filter(turf => {
      if (turf.latitude === undefined || turf.longitude === undefined) return false;
      const distance = getDistanceFromLatLonInKm(userLat, userLng, turf.latitude, turf.longitude);
      return distance <= maxDistanceKm;
    });

    // Map nearby turfs response
    const nearbyResponse = nearbyTurfs.map(turf => ({
      _id: turf._id,
      name: turf.name,
      pricePerHour: turf.pricePerHour,
      location: turf.location,
      latitude: turf.latitude,
      longitude: turf.longitude,
      openingTime: turf.openingTime,
      closingTime: turf.closingTime,
      description: turf.description,
      facilities: turf.facilities,
      images: turf.images.map(img => `/uploads/turfImg/${img}`),
      slots: turf.slots
    }));

    // Fetch single turf by turfId (optional)
    let singleTurf = null;
    if (turfId) {
      singleTurf = await Turf.findById(turfId);
      if (singleTurf) {
        singleTurf = {
          _id: singleTurf._id,
          name: singleTurf.name,
          pricePerHour: singleTurf.pricePerHour,
          location: singleTurf.location,
          latitude: singleTurf.latitude,
          longitude: singleTurf.longitude,
          openingTime: singleTurf.openingTime,
          closingTime: singleTurf.closingTime,
          description: singleTurf.description,
          facilities: singleTurf.facilities,
          images: singleTurf.images,
          imageUrls: singleTurf.images.map(img => `/uploads/turfImg/${img}`),
          slots: singleTurf.slots
        };
      }
    }

    res.status(200).json({
      success: true,
      nearbyTurfs: nearbyResponse,
      singleTurf
    });
  } catch (error) {
    console.error("Error fetching turfs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const updateUserProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Profile image file is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: req.file.path },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const bookTurfSlot = async (req, res) => {
  try {
    const { userId, turfId, date, timeSlot, hours, taxRate = 0 } = req.body; // Added hours & taxRate

    // Validate inputs
    if (!userId || !turfId || !date || !timeSlot || !hours) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find turf
    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ success: false, message: "Turf not found" });

    // Find slot
    const slotIndex = turf.slots.findIndex(
      (slot) => slot.date === date && slot.timeSlot === timeSlot
    );
    if (slotIndex === -1) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    // Check if already booked
    if (turf.slots[slotIndex].IsBooked) {
      return res.status(400).json({ success: false, message: "Slot already booked" });
    }

    // Calculate subtotal and total
    const pricePerHour = turf.pricePerHour;
    const subtotal = pricePerHour * hours;
    const total = subtotal + (subtotal * taxRate) / 100; // Optional tax calculation

    // Mark as booked
    turf.slots[slotIndex].IsBooked = true;
    await turf.save();

    // Create booking record
    const booking = new Booking({
      userId,
      turfId,
      date,
      timeSlot,
      hours,
      pricePerHour,
      subtotal,
      total,
    });
    await booking.save();

    // Add notification to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const notificationMsg = `Booking confirmed for turf "${turf.name}" on ${date} at ${timeSlot}. Total: $${total}.`;
    user.notifications.push(notificationMsg);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Slot booked successfully",
      bookingId: booking._id,
      notification: notificationMsg,
      total,
    });
  } catch (error) {
    console.error("Error booking turf slot:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const getUserTurfBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Fetch all bookings for the user, populating the associated turf details
    const bookings = await Booking.find({ userId }).populate('turfId');

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: "No bookings found" });
    }

    // Format the booking details
    const formatted = bookings.map(b => ({
      bookingId: b._id,
      turfName: b.turfId?.name || 'Deleted Turf',
      turfLocation: b.turfId?.location || '',
      date: b.date,
      timeSlot: b.timeSlot,
      status: b.status,
      createdAt: b.createdAt,
      images: b.turfId?.images?.map(img => `/uploads/turfImg/${img}`) || [],
      pricePerHour: b.pricePerHour,
      subtotal: b.subtotal,
      total: b.total
    }));

    // Return the formatted bookings
    res.status(200).json({ success: true, bookings: formatted });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      notifications: user.notifications || []
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const bookTournamentSlot = async (req, res) => {
  try {
    const { userId, tournamentId, date, timeSlot } = req.body;

    // Validate inputs
    if (!userId || !tournamentId || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    // Check if the date matches tournament details.date
    if (tournament.details.date !== date) {
      return res.status(400).json({ success: false, message: "Invalid date for this tournament" });
    }

    // Find slot in details.slots
    const slotIndex = tournament.details.slots.findIndex(
      slot => slot.timeSlot === timeSlot
    );

    if (slotIndex === -1) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    // Check if already booked
    if (tournament.details.slots[slotIndex].isBooked) {
      return res.status(400).json({ success: false, message: "Slot already booked" });
    }

    // Mark slot as booked
    tournament.details.slots[slotIndex].isBooked = true;
    await tournament.save();

    // Calculate Subtotal and Total
    const price = tournament.price;  // Assuming price is per team or per slot
    const subtotal = price;  // Here, it's just the price as no additional charges are mentioned
    const total = subtotal;  // Add taxes, processing fees if required later

    // Create booking record
    const booking = new Booking({
      userId,
      tournamentId,
      date,
      timeSlot,
      subtotal,
      total
    });
    await booking.save();

    // Notify user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const notificationMsg = `Tournament "${tournament.name}" booked for ${date} at ${timeSlot}`;
    user.notifications.push(notificationMsg);
    await user.save();

    // Return success with booking details
    res.status(200).json({
      success: true,
      message: "Tournament slot booked successfully",
      bookingId: booking._id,
      notification: notificationMsg,
      subtotal: subtotal,
      total: total
    });

  } catch (error) {
    console.error("Error booking tournament slot:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const getMyTournamentBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Fetch the user's tournament bookings, with tournament details populated
    const bookings = await Booking.find({ userId }).populate('tournamentId');

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: "No tournament bookings found" });
    }

    // Format the response to include subtotal and total for each booking
    const formattedBookings = bookings.map(b => ({
      bookingId: b._id,
      status: b.status || 'pending',   // Default status if not provided
      date: b.date,
      timeSlot: b.timeSlot,
      createdAt: b.createdAt,
      subtotal: b.subtotal || 0,      // Include subtotal if available
      total: b.total || 0,            // Include total if available
      tournament: b.tournamentId ? {
        _id: b.tournamentId._id,
        name: b.tournamentId.name,
        description: b.tournamentId.description,
        location: b.tournamentId.location,
        price: b.tournamentId.price,
        details: b.tournamentId.details,
        imageUrl: b.tournamentId.image ? `/uploads/tournamentImg/${b.tournamentId.image}` : null
      } : null
    }));

    res.status(200).json({ success: true, bookings: formattedBookings });

  } catch (error) {
    console.error("Error fetching user tournament bookings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const createTeam = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, teamName, players } = req.body;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (!teamName || !players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ message: 'Team name and players array are required' });
    }

    // Find the match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Create new team object
    const newTeam = {
      userId,
      teamName,
      players,
      createdAt: new Date()
    };

    // Push team into match's teams array
    match.teams.push(newTeam);
    await match.save();

    // Push this team info into user's myTeams array
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.myTeams = user.myTeams || [];
    user.myTeams.push({
      matchId,
      teamName,
      players,
      createdAt: newTeam.createdAt,
    });

    await user.save();

    return res.status(201).json({
      message: 'Team created and added to match and user successfully',
      team: newTeam,
      userMyTeams: user.myTeams,
      matchTeams: match.teams
    });

  } catch (error) {
    console.error('Create Team Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const addTeamToBooking = async (req, res) => {
  try {
    const { userId, bookingId } = req.params;
    const { name, players } = req.body;

    // Validation
    if (!name || !players || !Array.isArray(players) || players.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Team name and at least 5 players are required.",
      });
    }

    // Find booking with correct user
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found for this user.",
      });
    }

    // Push the new team into the teams array
    booking.teams.push({ name, players });
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Team added successfully.",
      teams: booking.teams,
    });
  } catch (error) {
    console.error("Error adding team:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
