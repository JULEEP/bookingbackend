import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import Turf from '../models/Turf.js';
import Booking from '../models/Booking.js';
import Tournament from '../models/turnamentModel.js';
import Match from '../models/Match.js';
import mongoose from 'mongoose';
import Team from '../models/Team.js';
import Category from '../models/categoryModel.js';
import { io } from '../server.js';
import GameCategory from '../models/GameCategory.js';
import GameTeam from '../models/GameTeam.js';
import GameMatch from '../models/GameMatch.js';
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
    const { otp, mobile } = req.body;

    if (!otp || !mobile) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP are required' });
    }

    // Find user by mobile and otp
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or OTP is incorrect' });
    }

    if (Date.now() > user.otpExpiration) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Clear OTP fields after verification
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
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
    let { userId, turfId, date, timeSlot, hours, taxRate = 0 } = req.body;

    // ✅ Convert to numbers (safe parse)
    hours = Number(hours);
    taxRate = Number(taxRate);

    if (!hours || hours <= 0) {
      return res.status(400).json({ success: false, message: "Invalid hours value" });
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

    // ✅ Calculate subtotal and total
    const pricePerHour = Number(turf.pricePerHour) || 0;
    const subtotal = pricePerHour * hours;
    const total = subtotal + (subtotal * taxRate) / 100;

    if (isNaN(subtotal) || isNaN(total)) {
      return res.status(400).json({ success: false, message: "Price calculation failed" });
    }

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

    const notificationMsg = `📢 Booking confirmed for turf "${turf.name}" on ${date} at ${timeSlot}. 
💰 Subtotal: $${subtotal}, Tax: ${taxRate}%, Total: $${total}`;

    user.notifications.push(notificationMsg);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Slot booked successfully ✅",
      bookingId: booking._id,
      subtotal,
      taxRate,
      total,
      notification: notificationMsg,
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
    const { userId } = req.params;
    const { teamName, players } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate required fields
    if (!teamName || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ message: "teamName and a non-empty players array are required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate players and build array with default status
    const playersArray = [];
    for (const playerName of players) {
      const player = await User.findOne({
        name: { $regex: new RegExp("^" + playerName + "$", "i") },
      });

      if (!player) {
        return res.status(404).json({ message: `Player ${playerName} not found in the database` });
      }

      playersArray.push({
        name: player.name,
        _id: player._id,
        status: "Not Playing", // ✅ default status added
      });
    }

    // Create and save team
    const newTeam = new Team({
      teamName,
      players: playersArray,
      createdBy: userId,
    });

    await newTeam.save();

    return res.status(201).json({
      message: "Team created successfully",
      team: newTeam,
    });

  } catch (error) {
    console.error("Error creating team:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllTeams = async (req, res) => {
  try {
    const { search, categoryId } = req.query;

    // ✅ CASE 1: If categoryId is provided, use GameTeam schema
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      const query = { categoryId };

      if (search && search.trim() !== "") {
        query.teamName = { $regex: new RegExp(search, "i") };
      }

      const gameTeams = await GameTeam.find(query);

      return res.status(200).json({
        success: true,
        total: gameTeams.length,
        message: "Teams fetched from GameTeam schema successfully",
        teams: gameTeams,
        source: "GameTeam"
      });
    }

    // ✅ CASE 2: Default — fetch from Team schema
    const query = {};

    if (search && search.trim() !== "") {
      query.teamName = { $regex: new RegExp(search, "i") };
    }

    const teams = await Team.find(query);

    return res.status(200).json({
      success: true,
      total: teams.length,
      message: "Teams fetched from Team schema successfully",
      teams,
      source: "Team"
    });

  } catch (error) {
    console.error("Error fetching teams:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const createMatch = async (req, res) => {
  try {
    const { userId } = req.params;
    const { team1, team2, overs, matchFormat, matchType, tournamentId } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate team1 and team2
    if (!mongoose.Types.ObjectId.isValid(team1) || !mongoose.Types.ObjectId.isValid(team2)) {
      return res.status(400).json({ message: "Invalid team ID(s)" });
    }

    const teamA = await Team.findById(team1);
    const teamB = await Team.findById(team2);
    if (!teamA || !teamB) {
      return res.status(404).json({ message: "One or both teams not found" });
    }

    // Validate required match fields
    if (!overs || !matchFormat || !matchType) {
      return res.status(400).json({ message: "overs, matchFormat, and matchType are required" });
    }

    // Validate tournamentId if provided
    let tournament = null;
    if (tournamentId) {
      if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }

      tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
    }

    // Set totalInnings based on matchFormat
    let totalInnings = 1;
    if (matchFormat.toLowerCase() === "test") {
      totalInnings = 2;
    }

    // Prepare match data
    const matchData = {
      team1,
      team2,
      totalOvers: overs,
      matchFormat,
      matchType,
      createdBy: userId,
      status: "Upcoming",
      inningStatus: "first innings",
      totalInnings
    };

    // Attach tournamentId if provided
    if (tournament) {
      matchData.tournamentId = tournamentId;
    }

    // Create and save match
    const newMatch = new Match(matchData);
    await newMatch.save();

    return res.status(201).json({
      success: true,
      message: "Match created successfully",
      match: newMatch
    });

  } catch (error) {
    console.error("Error creating match:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllMatches = async (req, res) => {
  try {
    const { status } = req.query; // only status is used now

    // Build query object
    const query = {};

    // Apply case-insensitive status filter (e.g., Upcoming, Completed)
    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }

    const matches = await Match.find(query)
      .populate("categoryId", "name")
      .populate("tournamentId", "name")
      .populate({
        path: "team1",
        select: "teamName players",  // Include players here
        populate: { path: "players", select: "name email" } // Populate player details
      })
      .populate({
        path: "team2",
        select: "teamName players",  // Include players here
        populate: { path: "players", select: "name email" } // Populate player details
      })
      .populate("teams", "teamName")  // If you need teams as well
      .populate("players", "name email")  // If you need players for other purposes
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: matches.length,
      matches,
    });

  } catch (error) {
    console.error("Error fetching matches:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getSingleMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Match ID is required" });
    }

    const match = await Match.findById(id)
      .populate("categoryId", "name")
      .populate("tournamentId", "name")
      .populate("team1", "teamName players")
      .populate("team2", "teamName players")
      .populate("currentStriker", "name")
      .populate("nonStriker", "name")
      .populate("currentBowler", "name")
      .populate("opening.striker", "name")
      .populate("opening.nonStriker", "name")
      .populate("bowling.bowler", "name");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // ✅ DEBUG: Detailed overHistory analysis
    console.log("=== DETAILED OVERHISTORY ANALYSIS ===");
    if (match.scores && match.scores.length > 0) {
      match.scores.forEach((score, index) => {
        const inningsNum = score.innings || index + 1;
        console.log(`🏏 INNINGS ${inningsNum}: Total Runs: ${score.runs}, Overs: ${score.overs}, Wickets: ${score.wickets}`);
        
        if (score.overHistory && score.overHistory.length > 0) {
          console.log(`   Over History: ${score.overHistory.length} overs`);
          score.overHistory.forEach((over, overIndex) => {
            console.log(`   Over ${over.overNumber}: ${over.balls?.length || 0} balls, ${over.runs} runs`);
            
            if (over.balls && over.balls.length > 0) {
              over.balls.forEach((ball, ballIndex) => {
                console.log(`     Ball ${ballIndex + 1}: Striker:${ball.striker}, Runs:${ball.runs}, Wicket:${ball.wicket || 'No'}`);
              });
            }
          });
        } else {
          console.log(`   ❌ NO OVER HISTORY FOUND FOR INNINGS ${inningsNum}`);
        }
        
        // ✅ DEBUG CURRENT OVER
        if (score.currentOver && score.currentOver.balls && score.currentOver.balls.length > 0) {
          console.log(`   🔥 CURRENT OVER ${score.currentOver.overNumber}: ${score.currentOver.balls.length} balls`);
          score.currentOver.balls.forEach((ball, ballIndex) => {
            console.log(`     Ball ${ballIndex + 1}: Striker:${ball.striker}, Runs:${ball.runs}, Wicket:${ball.wicket || 'No'}`);
          });
        }
      });
    } else {
      console.log("❌ NO SCORES DATA FOUND IN MATCH");
    }
    console.log("=== END DEBUG ===");

    // ✅ CURRENT PLAYERS ON FIELD
    const getCurrentPlayers = () => {
      return {
        currentBowler: match.currentBowler ? {
          _id: match.currentBowler._id,
          name: match.currentBowler.name
        } : null,
        currentStriker: match.currentStriker ? {
          _id: match.currentStriker._id,
          name: match.currentStriker.name
        } : null,
        nonStriker: match.nonStriker ? {
          _id: match.nonStriker._id,
          name: match.nonStriker.name
        } : null
      };
    };

    const currentPlayers = getCurrentPlayers();
    const currentInnings = match.currentInnings || 1;

    // ✅ PLAYER NAME MAPPING
    const playerNameMap = new Map();

    // Team1 players
    if (match.team1 && match.team1.players) {
      match.team1.players.forEach(player => {
        if (player._id) {
          playerNameMap.set(player._id.toString(), player.name);
        }
      });
    }

    // Team2 players
    if (match.team2 && match.team2.players) {
      match.team2.players.forEach(player => {
        if (player._id) {
          playerNameMap.set(player._id.toString(), player.name);
        }
      });
    }

    // Additional players
    const additionalPlayers = [
      match.currentStriker,
      match.nonStriker,
      match.currentBowler,
      match.opening?.striker,
      match.opening?.nonStriker,
      match.bowling?.bowler
    ];

    additionalPlayers.forEach(player => {
      if (player && player._id) {
        playerNameMap.set(player._id.toString(), player.name);
      }
    });

    // ✅ FIXED FUNCTION: Calculate batting stats ONLY from overHistory
    const calculateBattingStats = (playerId, inningsNumber) => {
      if (!playerId) return null;

      const playerIdStr = playerId.toString();
      
      console.log(`🔍 Calculating batting stats for ${playerNameMap.get(playerIdStr)} in innings ${inningsNumber}`);
      
      // ✅ USE ONLY OVERHISTORY (completed overs)
      let runs = 0;
      let balls = 0;
      let fours = 0;
      let sixes = 0;
      let isOut = false;
      let dismissal = '';

      if (match.scores && match.scores.length > 0) {
        match.scores.forEach(score => {
          const scoreInnings = score.innings || 1;
          if (scoreInnings !== inningsNumber) return;
          
          // ✅ SOURCE 1: OVERHISTORY (completed overs) - ONLY THIS
          if (score.overHistory) {
            score.overHistory.forEach(over => {
              if (over.balls) {
                over.balls.forEach(ball => {
                  const ballStrikerId = ball.striker?.toString();
                  if (ballStrikerId === playerIdStr) {
                    // ✅ BYE/LEGBYE RUNS BATSMAN KO NAHI MILENGE
                    if (ball.extraType !== 'bye' && ball.extraType !== 'legbye') {
                      const ballRuns = ball.runs || 0;
                      runs += ballRuns;
                      
                      if (ballRuns === 4) fours += 1;
                      if (ballRuns === 6) sixes += 1;
                    }
                    
                    // ✅ ONLY COUNT LEGAL DELIVERY BALLS (excluding wides, noballs, byes, legbyes)
                    if (!ball.extraType || (ball.extraType !== 'wide' && ball.extraType !== 'noball' && ball.extraType !== 'bye' && ball.extraType !== 'legbye')) {
                      balls += 1;
                    }
                    
                    // ✅ CHECK WICKET
                    if (ball.wicket && ball.striker?.toString() === playerIdStr) {
                      isOut = true;
                      dismissal = ball.dismissalType || '';
                      console.log(`   🚨 WICKET from overHistory: ${playerNameMap.get(playerIdStr)} dismissed by ${dismissal}`);
                    }
                  }
                });
              }
            });
          }
          
          // ❌ CURRENTOVER IGNORE KARO - SIRF OVERHISTORY SE DATA LO
        });
      }

      const strikeRate = balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0;

      console.log(`📊 OVERHISTORY ONLY STATS - Batsman ${playerNameMap.get(playerIdStr)}: ${runs}r/${balls}b, 4s:${fours}, 6s:${sixes}, Out:${isOut}`);

      return {
        runs,
        balls,
        fours,
        sixes,
        strikeRate,
        isOut,
        dismissals: dismissal
      };
    };

    // ✅ FIXED FUNCTION: Calculate bowling stats ONLY from overHistory
    const calculateBowlingStats = (playerId, inningsNumber) => {
      if (!playerId) return null;

      const playerIdStr = playerId.toString();
      console.log(`🔍 Calculating bowling stats for ${playerNameMap.get(playerIdStr)} in innings ${inningsNumber}`);
      
      // ✅ USE ONLY OVERHISTORY (completed overs)
      let overs = 0;
      let runsConceded = 0;
      let wickets = 0;
      let maidens = 0;
      let wides = 0;
      let noBalls = 0;
      let byes = 0;
      let legByes = 0;

      if (match.scores && match.scores.length > 0) {
        match.scores.forEach(score => {
          const scoreInnings = score.innings || 1;
          if (scoreInnings !== inningsNumber) return;
          
          // ✅ COUNT COMPLETED OVERS FROM OVERHISTORY ONLY
          if (score.overHistory) {
            score.overHistory.forEach(over => {
              if (over.balls && over.balls.length > 0) {
                const firstBallBowler = over.balls[0]?.bowler?.toString();
                if (firstBallBowler === playerIdStr) {
                  overs += 1; // Each completed over is 1 over
                  
                  let overRuns = 0;
                  let overWickets = 0;
                  let overWides = 0;
                  let overNoBalls = 0;
                  let overByes = 0;
                  let overLegByes = 0;
                  let isMaiden = true;
                  
                  over.balls.forEach(ball => {
                    if (ball.bowler?.toString() === playerIdStr) {
                      // ✅ COUNT ALL RUNS CONCEDED BY THIS BOWLER
                      overRuns += ball.runs || 0;
                      
                      // ✅ ADD EXTRA RUNS FOR WIDE/NOBALL
                      if (ball.extraType === 'wide' || ball.extraType === 'noball') {
                        overRuns += 1;
                      }
                      
                      if (ball.wicket) overWickets += 1;
                      if (ball.extraType === 'wide') overWides += 1;
                      if (ball.extraType === 'noball') overNoBalls += 1;
                      if (ball.extraType === 'bye') overByes += (ball.runs || 0);
                      if (ball.extraType === 'legbye') overLegByes += (ball.runs || 0);
                      
                      // ✅ MAIDEN OVER CHECK (no runs excluding extras)
                      if ((ball.runs || 0) > 0 && ball.extraType !== 'wide' && ball.extraType !== 'noball' && ball.extraType !== 'bye' && ball.extraType !== 'legbye') {
                        isMaiden = false;
                      }
                    }
                  });
                  
                  runsConceded += overRuns;
                  wickets += overWickets;
                  wides += overWides;
                  noBalls += overNoBalls;
                  byes += overByes;
                  legByes += overLegByes;
                  if (isMaiden) maidens += 1;
                  
                  console.log(`   🎯 Over ${over.overNumber}: ${overRuns}r, ${overWickets}w, Maiden:${isMaiden}`);
                }
              }
            });
          }
          
          // ❌ CURRENTOVER IGNORE KARO - SIRF OVERHISTORY SE DATA LO
        });
      }

      const economy = overs > 0 ? parseFloat((runsConceded / overs).toFixed(2)) : 0;

      console.log(`📊 OVERHISTORY ONLY STATS - Bowler ${playerNameMap.get(playerIdStr)}: ${overs}ov, ${runsConceded}r, ${wickets}w, Eco: ${economy}`);

      return {
        overs: parseFloat(overs.toFixed(1)),
        runsConceded,
        wickets,
        maidens,
        economy,
        wides,
        noBalls,
        byes,
        legByes
      };
    };

    // ✅ CURRENT BATSMEN STATS
    const getCurrentBatsmenStats = () => {
      const formatBatsmanDisplay = (stats, player) => {
        if (!player) return null;

        if (!stats) {
          return {
            playerId: player._id,
            playerName: player.name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            display: "0* (0 balls)",
            detailedDisplay: "0* (0 balls, 0x4, 0x6) SR: 0"
          };
        }

        return {
          playerId: player._id,
          playerName: player.name,
          runs: stats.runs,
          balls: stats.balls,
          fours: stats.fours,
          sixes: stats.sixes,
          strikeRate: stats.strikeRate,
          display: `${stats.runs}${!stats.isOut ? '*' : ''} (${stats.balls} balls)`,
          detailedDisplay: `${stats.runs}${!stats.isOut ? '*' : ''} (${stats.balls} balls, ${stats.fours}x4, ${stats.sixes}x6) SR: ${stats.strikeRate}`
        };
      };

      const strikerStats = calculateBattingStats(currentPlayers.currentStriker?._id, currentInnings);
      const nonStrikerStats = calculateBattingStats(currentPlayers.nonStriker?._id, currentInnings);

      return {
        striker: formatBatsmanDisplay(strikerStats, currentPlayers.currentStriker),
        nonStriker: formatBatsmanDisplay(nonStrikerStats, currentPlayers.nonStriker)
      };
    };

    // ✅ CURRENT BOWLER STATS
    const getCurrentBowlerStats = () => {
      if (!currentPlayers.currentBowler) return null;

      const stats = calculateBowlingStats(currentPlayers.currentBowler._id, currentInnings);
      
      if (!stats) {
        return {
          playerId: currentPlayers.currentBowler._id,
          playerName: currentPlayers.currentBowler.name,
          overs: 0,
          runs: 0,
          wickets: 0,
          maidens: 0,
          economy: 0,
          wides: 0,
          noBalls: 0,
          byes: 0,
          legByes: 0,
          display: "0-0-0-0",
          detailedDisplay: "0 overs, 0 maidens, 0 runs, 0 wickets"
        };
      }

      return {
        playerId: currentPlayers.currentBowler._id,
        playerName: currentPlayers.currentBowler.name,
        overs: stats.overs,
        runs: stats.runsConceded,
        wickets: stats.wickets,
        maidens: stats.maidens,
        economy: stats.economy,
        wides: stats.wides,
        noBalls: stats.noBalls,
        byes: stats.byes,
        legByes: stats.legByes,
        display: `${stats.overs}-${stats.maidens}-${stats.runsConceded}-${stats.wickets}`,
        detailedDisplay: `${stats.overs} overs, ${stats.maidens} maidens, ${stats.runsConceded} runs, ${stats.wickets} wickets`
      };
    };

    // ✅ ADD STATUS TO TEAM PLAYERS - USE playerStatuses FROM MATCH
    const addStatusToTeamPlayers = (team, isBattingTeam = false) => {
      if (!team || !team.players) return team;

      const currentBatsmenStats = getCurrentBatsmenStats();
      const currentBowlerStats = getCurrentBowlerStats();

      return {
        _id: team._id,
        teamName: team.teamName,
        players: team.players.map(player => {
          const playerIdStr = player._id.toString();
          
          // ✅ FIND PLAYER STATUS FROM match.playerStatuses
          const playerStatusData = match.playerStatuses?.find(ps => 
            ps.playerId.toString() === playerIdStr
          );
          
          const basePlayer = {
            name: player.name,
            _id: player._id,
            status: playerStatusData?.playerStatus || 'Not Playing' // ✅ USE playerStatus FROM match
          };

          // ✅ ADD STATS BASED ON CURRENT POSITION
          if (isBattingTeam) {
            if (currentPlayers.currentStriker && currentPlayers.currentStriker._id.toString() === playerIdStr) {
              return {
                ...basePlayer,
                stats: currentBatsmenStats.striker ? {
                  runs: currentBatsmenStats.striker.runs,
                  balls: currentBatsmenStats.striker.balls,
                  fours: currentBatsmenStats.striker.fours,
                  sixes: currentBatsmenStats.striker.sixes,
                  strikeRate: currentBatsmenStats.striker.strikeRate,
                  display: currentBatsmenStats.striker.display
                } : null
              };
            } else if (currentPlayers.nonStriker && currentPlayers.nonStriker._id.toString() === playerIdStr) {
              return {
                ...basePlayer,
                stats: currentBatsmenStats.nonStriker ? {
                  runs: currentBatsmenStats.nonStriker.runs,
                  balls: currentBatsmenStats.nonStriker.balls,
                  fours: currentBatsmenStats.nonStriker.fours,
                  sixes: currentBatsmenStats.nonStriker.sixes,
                  strikeRate: currentBatsmenStats.nonStriker.strikeRate,
                  display: currentBatsmenStats.nonStriker.display
                } : null
              };
            }
          } else {
            if (currentPlayers.currentBowler && currentPlayers.currentBowler._id.toString() === playerIdStr) {
              return {
                ...basePlayer,
                stats: currentBowlerStats ? {
                  overs: currentBowlerStats.overs,
                  runs: currentBowlerStats.runs,
                  wickets: currentBowlerStats.wickets,
                  maidens: currentBowlerStats.maidens,
                  economy: currentBowlerStats.economy,
                  wides: currentBowlerStats.wides,
                  noBalls: currentBowlerStats.noBalls,
                  byes: currentBowlerStats.byes,
                  legByes: currentBowlerStats.legByes,
                  display: currentBowlerStats.display
                } : null
              };
            }
          }

          return basePlayer;
        })
      };
    };

    // ✅ TEAM STATUS DETERMINATION
    const determineTeamStatus = () => {
      const currentInnings = match.currentInnings || 1;
      let battingTeam = null;
      let bowlingTeam = null;

      if (currentInnings === 1) {
        battingTeam = match.team1;
        bowlingTeam = match.team2;
      } else if (currentInnings === 2) {
        battingTeam = match.team2;
        bowlingTeam = match.team1;
      }

      const battingStatus = `${battingTeam?.teamName} is batting`;
      const bowlingStatus = `${bowlingTeam?.teamName} is bowling`;

      return {
        battingTeam,
        bowlingTeam,
        currentInnings,
        totalInnings: match.totalInnings || 2,
        matchStatus: match.status || 'live',
        toss: match.toss || {},
        decision: match.decision || 'bat',
        battingStatus: battingStatus,
        bowlingStatus: bowlingStatus
      };
    };

    const teamStatus = determineTeamStatus();

    // ✅ CREATE TEAMS WITH STATUS
    const team1WithStatus = addStatusToTeamPlayers(
      match.team1, 
      teamStatus.battingTeam && teamStatus.battingTeam._id.toString() === match.team1._id.toString()
    );
    const team2WithStatus = addStatusToTeamPlayers(
      match.team2, 
      teamStatus.battingTeam && teamStatus.battingTeam._id.toString() === match.team2._id.toString()
    );

    // ✅ LIVE DATA
    const currentBatsmenStats = getCurrentBatsmenStats();
    const currentBowlerStats = getCurrentBowlerStats();

    const liveData = {
      innings: match.currentInnings || 1,
      score: `${match.runs || 0}/${match.wickets || 0}`,
      overs: match.overs || 0,
      runRate: match.runRate || 0,
      fallOfWickets: match.fallOfWickets || [],
      commentary: match.commentary || [],
      overHistory: match.scores && match.scores.length > 0 ? 
        (match.scores[match.scores.length - 1].overHistory || []) : [],
      currentOver: match.scores && match.scores.length > 0 ? 
        (match.scores[match.scores.length - 1].currentOver || {}) : {},
      playersHistory: match.playersHistory || [],
      currentBowler: currentPlayers.currentBowler ? {
        ...currentPlayers.currentBowler,
        stats: currentBowlerStats
      } : null,
      currentStriker: currentPlayers.currentStriker ? {
        ...currentPlayers.currentStriker,
        stats: currentBatsmenStats.striker
      } : null,
      nonStriker: currentPlayers.nonStriker ? {
        ...currentPlayers.nonStriker,
        stats: currentBatsmenStats.nonStriker
      } : null,
      battingTeam: {
        ...teamStatus.battingTeam,
        teamName: teamStatus.battingTeam?.teamName
      },
      bowlingTeam: {
        ...teamStatus.bowlingTeam,
        teamName: teamStatus.bowlingTeam?.teamName
      },
      battingStatus: teamStatus.battingStatus,
      bowlingStatus: teamStatus.bowlingStatus,
      lastUpdate: new Date().toISOString()
    };

    // ✅ UPDATED SCORECARD GENERATION - ALWAYS SHOW BOTH INNINGS
    const generateScorecard = () => {
      const inningsData = [];
      const totalInnings = 2; // ✅ HAR WAQT 2 INNINGS SHOW KARO

      console.log(`🎯 Generating scorecard for BOTH innings always...`);

      // ✅ HAR WAQT DONO INNINGS BANAO - CHAHE DATA HO YA NA HO
      for (let inningsNumber = 1; inningsNumber <= totalInnings; inningsNumber++) {
        
        // ✅ FIND EXISTING SCORE DATA FOR THIS INNINGS
        let score = match.scores?.find(s => s.innings === inningsNumber);
        
        // ✅ AGAR SCORE DATA NAHI HAI, TOH EMPTY DATA BANAO
        if (!score) {
          console.log(`🆕 Creating empty score data for innings ${inningsNumber}`);
          score = {
            innings: inningsNumber,
            runs: 0,
            wickets: 0,
            overs: 0,
            runRate: 0,
            extras: {
              wides: 0,
              noBalls: 0,
              byes: 0,
              legByes: 0,
              penalties: 0,
              total: 0
            },
            overHistory: [],
            currentOver: {},
            fallOfWickets: []
          };
        }

        // ✅ TEAMS DETERMINATION
        let battingTeam, bowlingTeam;
        if (inningsNumber === 1) {
          battingTeam = {
            id: team1WithStatus._id,
            name: team1WithStatus.teamName
          };
          bowlingTeam = {
            id: team2WithStatus._id,
            name: team2WithStatus.teamName
          };
        } else {
          // ✅ SECOND INNINGS: Team2 batting, Team1 bowling
          battingTeam = {
            id: team2WithStatus._id,
            name: team2WithStatus.teamName
          };
          bowlingTeam = {
            id: team1WithStatus._id,
            name: team1WithStatus.teamName
          };
        }

        // ✅ BATTING DATA - ONLY FROM OVERHISTORY
        const battingData = [];
        const battingTeamPlayers = inningsNumber === 1 ? team1WithStatus.players : team2WithStatus.players;
        
        console.log(`🔄 Processing batting for innings ${inningsNumber}, ${battingTeamPlayers.length} players`);
        
        battingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          const playerStats = calculateBattingStats(teamPlayer._id, inningsNumber);
          
          // ✅ FIND PLAYER STATUS FROM match.playerStatuses
          const playerStatusData = match.playerStatuses?.find(ps => 
            ps.playerId.toString() === playerIdStr
          );
          
          let status = playerStatusData?.playerStatus || 'Not Played Yet'; // ✅ USE playerStatus
          let isNotOut = true;
          let dismissal = '';
                  
          if (playerStats && (playerStats.runs > 0 || playerStats.balls > 0)) {
            isNotOut = !playerStats.isOut;
            dismissal = playerStats.dismissals || '';
            
            // ✅ CURRENT INNINGS KE HISAB SE STATUS SET KARO
            if (inningsNumber === match.currentInnings) {
              if (currentPlayers.currentStriker && currentPlayers.currentStriker._id.toString() === playerIdStr) {
                status = 'Batting (Striker)';
              } else if (currentPlayers.nonStriker && currentPlayers.nonStriker._id.toString() === playerIdStr) {
                status = 'Batting (Non-Striker)';
              } else {
                status = isNotOut ? 'Batting Completed (Not Out)' : 'Out';
              }
            } else {
              // Previous innings completed
              status = isNotOut ? 'Batting Completed (Not Out)' : 'Out';
            }
          } else if (inningsNumber === match.currentInnings) {
            // ✅ CURRENT INNINGS KE PLAYERS KO BATTING STATUS DO
            if (currentPlayers.currentStriker && currentPlayers.currentStriker._id.toString() === playerIdStr) {
              status = 'Batting (Striker)';
            } else if (currentPlayers.nonStriker && currentPlayers.nonStriker._id.toString() === playerIdStr) {
              status = 'Batting (Non-Striker)';
            }
          }
          
          battingData.push({
            playerId: teamPlayer._id,
            playerName: playerName,
            runs: playerStats?.runs || 0,
            balls: playerStats?.balls || 0,
            fours: playerStats?.fours || 0,
            sixes: playerStats?.sixes || 0,
            strikeRate: playerStats?.strikeRate || 0,
            dismissal: dismissal,
            isNotOut: isNotOut,
            status: status
          });
        });

        // ✅ BOWLING DATA - ONLY FROM OVERHISTORY
        const bowlingData = [];
        const bowlingTeamPlayers = inningsNumber === 1 ? team2WithStatus.players : team1WithStatus.players;
        
        console.log(`🔄 Processing bowling for innings ${inningsNumber}, ${bowlingTeamPlayers.length} players`);
        
        bowlingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          const playerStats = calculateBowlingStats(teamPlayer._id, inningsNumber);
                  
          // ✅ FIND PLAYER STATUS FROM match.playerStatuses
          const playerStatusData = match.playerStatuses?.find(ps => 
            ps.playerId.toString() === playerIdStr
          );
          
          let status = playerStatusData?.playerStatus || 'Not Played Yet'; // ✅ USE playerStatus


                  
          if (playerStats && (playerStats.overs > 0 || playerStats.wickets > 0 || playerStats.runsConceded > 0)) {
            if (inningsNumber === match.currentInnings) {
              if (currentPlayers.currentBowler && currentPlayers.currentBowler._id.toString() === playerIdStr) {
                status = 'Bowling';
              } else {
                status = 'Bowling Completed';
              }
            } else {
              status = 'Bowling Completed';
            }
          } else if (inningsNumber === match.currentInnings) {
            // ✅ CURRENT INNINGS KE BOWLER KO STATUS DO
            if (currentPlayers.currentBowler && currentPlayers.currentBowler._id.toString() === playerIdStr) {
              status = 'Bowling';
            }
          }
          
          bowlingData.push({
            playerId: teamPlayer._id,
            playerName: playerName,
            overs: playerStats?.overs || 0,
            maidens: playerStats?.maidens || 0,
            runs: playerStats?.runsConceded || 0,
            wickets: playerStats?.wickets || 0,
            economy: playerStats?.economy || 0,
            wides: playerStats?.wides || 0,
            noBalls: playerStats?.noBalls || 0,
            byes: playerStats?.byes || 0,
            legByes: playerStats?.legByes || 0,
            status: status
          });
        });

        // ✅ EXTRAS DATA - OVERHISTORY SE CALCULATE KARO
        const calculateExtrasFromOverHistory = () => {
          let wides = 0;
          let noBalls = 0;
          let byes = 0;
          let legByes = 0;
          let penalties = 0;

          if (score.overHistory) {
            score.overHistory.forEach(over => {
              if (over.balls) {
                over.balls.forEach(ball => {
                  if (ball.extraType === 'wide') wides += 1;
                  else if (ball.extraType === 'noball') noBalls += 1;
                  else if (ball.extraType === 'bye') byes += (ball.runs || 0);
                  else if (ball.extraType === 'legbye') legByes += (ball.runs || 0);
                });
              }
            });
          }

          const total = wides + noBalls + byes + legByes + penalties;

          return {
            wides,
            noBalls,
            byes,
            legByes,
            penalties,
            total
          };
        };

        const extras = calculateExtrasFromOverHistory();

        // ✅ FALL OF WICKETS - OVERHISTORY SE CALCULATE KARO
        const calculateFallOfWickets = () => {
          const fallOfWickets = [];
          let wicketCount = 0;

          if (score.overHistory) {
            score.overHistory.forEach(over => {
              if (over.balls) {
                over.balls.forEach(ball => {
                  if (ball.wicket && ball.striker) {
                    wicketCount++;
                    const batsmanName = playerNameMap.get(ball.striker.toString()) || 'Unknown';
                    const bowlerName = ball.bowler ? playerNameMap.get(ball.bowler.toString()) : 'Unknown';
                    
                    fallOfWickets.push({
                      batsman: batsmanName,
                      runs: score.runs || 0, // Total score at that time
                      wicket: wicketCount,
                      overs: `${over.overNumber}.${ball.ballNumber}`,
                      dismissal: ball.dismissalType || 'bowled',
                      bowler: bowlerName
                    });
                  }
                });
              }
            });
          }

          return fallOfWickets;
        };

        const fallOfWickets = calculateFallOfWickets();

        inningsData.push({
          inningsNumber: inningsNumber,
          battingTeam: battingTeam,
          bowlingTeam: bowlingTeam,
          totalRuns: score.runs || 0,
          totalWickets: score.wickets || 0,
          totalOvers: score.overs || 0,
          runRate: score.runRate || 0,
          extras: extras,
          batting: battingData,
          bowling: bowlingData,
          fallOfWickets: fallOfWickets
        });
      }

      // Match summary
      const matchSummary = {
        toss: {
          winner: match.toss?.winner || null,
          elected: match.decision || 'bat',
          winnerName: match.toss?.winner ? 
            (match.toss.winner.toString() === team1WithStatus._id.toString() ? 
              team1WithStatus.teamName : team2WithStatus.teamName) : null
        },
        result: match.status === 'completed' ? 'Match Completed' : 
                match.status === 'upcoming' ? 'Match Not Started' : 'Match in Progress',
        currentInnings: match.currentInnings || 1,
        manOfTheMatch: match.manOfTheMatch || null,
        venue: match.venue,
        date: match.date,
        matchType: match.matchType,
        target: match.target || null
      };

      console.log(`✅ Final innings data:`, inningsData.map(inn => ({
        inningsNumber: inn.inningsNumber,
        battingTeam: inn.battingTeam.name,
        totalRuns: inn.totalRuns,
        totalWickets: inn.totalWickets,
        battingPlayers: inn.batting.length,
        bowlingPlayers: inn.bowling.length
      })));

      return {
        innings: inningsData,
        matchSummary: matchSummary
      };
    };

    // ✅ MVP Leaderboard + Top Performers (for UI)
    const calculateMVPLeaderboard = (scorecard) => {
      if (!scorecard || !scorecard.innings) return { playerPoints: [], topPerformers: {} };

      const playerStatsMap = new Map();

      scorecard.innings.forEach(inn => {
        // 🏏 Batting
        inn.batting.forEach(bat => {
          const pid = bat.playerId?.toString();
          if (!pid) return;
          if (!playerStatsMap.has(pid)) {
            playerStatsMap.set(pid, {
              name: bat.playerName,
              runs: 0,
              wickets: 0,
              points: 0
            });
          }
          const ps = playerStatsMap.get(pid);
          ps.runs += bat.runs;

          // ✅ Run-based proportional points (0.5 per run)
          ps.points += bat.runs * 0.5;

          // ✅ Bonus points
          if (bat.runs >= 50) ps.points += 4;
          if (bat.runs >= 100) ps.points += 8;
          ps.points += (bat.fours || 0) + (bat.sixes || 0) * 2;
        });

        // 🎯 Bowling
        inn.bowling.forEach(bowl => {
          const pid = bowl.playerId?.toString();
          if (!pid) return;
          if (!playerStatsMap.has(pid)) {
            playerStatsMap.set(pid, {
              name: bowl.playerName,
              runs: 0,
              wickets: 0,
              points: 0
            });
          }
          const ps = playerStatsMap.get(pid);
          ps.wickets += bowl.wickets;

          // ✅ Bowling points
          ps.points += bowl.wickets * 10;
          if (bowl.wickets >= 3) ps.points += 4;
          if (bowl.wickets >= 5) ps.points += 8;
          if (bowl.economy && bowl.economy <= 4) ps.points += 4;
        });
      });

      const allPlayers = Array.from(playerStatsMap.values());

      // 🏆 Identify top performers
      const bestBatsman = allPlayers.reduce((max, p) => (p.runs > (max?.runs || 0) ? p : max), null);
      const bestBowler = allPlayers.reduce((max, p) => (p.wickets > (max?.wickets || 0) ? p : max), null);
      const bestAllRounder = allPlayers.reduce((best, p) => {
        const score = (p.runs >= 30 ? p.runs / 10 : 0) + (p.wickets * 5);
        const bestScore = (best ? (best.runs / 10 + best.wickets * 5) : 0);
        return score > bestScore ? p : best;
      }, null);

      // 🔢 Sort players by points
      const sortedPlayers = allPlayers.sort((a, b) => b.points - a.points);

      // 🧾 Format player points section
      const playerPoints = sortedPlayers.map((p, i) => ({
        rank: i + 1,
        player: p.name,
        runs: p.runs,
        wickets: p.wickets,
        points: parseFloat(p.points.toFixed(1))
      }));

      // 🎯 Top Performers section
      const topPerformers = {
        bestBatsman: bestBatsman ? { player: bestBatsman.name, runs: bestBatsman.runs } : null,
        bestBowler: bestBowler ? { player: bestBowler.name, wickets: bestBowler.wickets } : null,
        bestAllRounder: bestAllRounder ? { player: bestAllRounder.name, runs: bestAllRounder.runs, wickets: bestAllRounder.wickets } : null
      };

      // 👑 Final structure
      return {
        playerPoints,
        topPerformers
      };
    };

    const scorecard = generateScorecard();
    const mvpLeaderboard = calculateMVPLeaderboard(scorecard);

    // ✅ FINAL RESPONSE
    const responseData = {
      success: true,
      match: {
        ...match._doc,
        team1: team1WithStatus,
        team2: team2WithStatus,
        scorecard: scorecard,
        liveData: liveData,
        mvpLeaderboard,
        currentPlayers: {
          striker: currentBatsmenStats.striker,
          nonStriker: currentBatsmenStats.nonStriker,
          bowler: currentBowlerStats
        },
      }
    };

    // ✅ SOCKET.IO EMIT - ADDED HERE
    const io = req.app.get("io");
    if (io) {
      io.emit("live-match-update", {
        type: "MATCH_FETCHED",
        matchId: id,
        data: responseData,
        timestamp: new Date().toISOString()
      });
      console.log("📡 Socket emit: live-match-update - MATCH_FETCHED");
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching single match:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
export const getSingleMatch = async (req, res) => {
  try {
    const { userId, matchId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }

    const match = await Match.findById(matchId)
      .populate("categoryId", "name")
      .populate("tournamentId", "name")
      .populate("teams")
      .populate("players", "name email");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    return res.status(200).json({
      success: true,
      match,
    });

  } catch (error) {
    console.error("Error fetching match:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};




export const startMatch = async (req, res) => {
  try {
    const { matchId, userId } = req.params;
    const {
      tossWinner,
      electedTo,
      striker,
      nonStriker,
      bowler,
      bowlingStyle,
    } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Validate required fields
    if (!tossWinner || !electedTo || !striker || !nonStriker || !bowler || !bowlingStyle) {
      return res.status(400).json({
        message: "Missing required fields: tossWinner, electedTo, striker, nonStriker, bowler, bowlingStyle",
      });
    }

    // Update match info
    match.status = "Live";
    match.toss = {
      winner: tossWinner,
      elected: electedTo,
    };
    match.currentStriker = striker;
    match.nonStriker = nonStriker;
    match.currentBowler = bowler;
    match.bowling = { style: bowlingStyle };
    match.currentInnings = 1;

    // Prepare playerStatuses
    const playerStatuses = [];

    const team1 = await Team.findById(match.team1);
    const team2 = await Team.findById(match.team2);

    if (!team1 || !team2) {
      return res.status(404).json({ message: "One or both teams not found" });
    }

    // Decide battingTeam and bowlingTeam
    const battingTeamId = electedTo === 'Bat' ? tossWinner : (tossWinner === match.team1.toString() ? match.team2 : match.team1);
    const bowlingTeamId = battingTeamId === match.team1.toString() ? match.team2.toString() : match.team1.toString();

    const teams = [
      { team: team1, isBattingTeam: team1._id.toString() === battingTeamId },
      { team: team2, isBattingTeam: team2._id.toString() === battingTeamId },
    ];

    // Loop through both teams and assign playerStatuses accordingly
    for (const { team, isBattingTeam } of teams) {
      for (const player of team.players) {
        let playerStatus = "";

        if (isBattingTeam) {
          if (player._id.toString() === striker) {
            playerStatus = "Batting (Striker)";
          } else if (player._id.toString() === nonStriker) {
            playerStatus = "Batting (Non-Striker)";
          } else {
            playerStatus = "Yet to Bat";
          }
        } else {
          if (player._id.toString() === bowler) {
            playerStatus = "Bowling";
          } else {
            playerStatus = "Fielding";
          }
        }

        playerStatuses.push({
          playerId: player._id,
          teamId: team._id,
          playerName: player.name,
          playerStatus,
        });
      }
    }

    // Save to match
    match.playerStatuses = playerStatuses;
    await match.save();

    // Send response
    return res.status(200).json({
      success: true,
      message: "Match started successfully",
      match: {
        _id: match._id,
        status: match.status,
        toss: match.toss,
        currentInnings: match.currentInnings,
        currentStriker: match.currentStriker,
        nonStriker: match.nonStriker,
        currentBowler: match.currentBowler,
        bowling: match.bowling,
        matchFormat: match.matchFormat,
        inningStatus: match.inningStatus,
        totalInnings: match.totalInnings,
        playerStatuses: match.playerStatuses,
        team1: {
          _id: team1._id,
          teamName: team1.teamName,
          players: team1.players,
        },
        team2: {
          _id: team2._id,
          teamName: team2.teamName,
          players: team2.players,
        },
      },
    });

  } catch (error) {
    console.error("Error starting match:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


export const searchUsers = async (req, res) => {
  try {
    const { search } = req.query; // now using ?search=something

    if (!search || search.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    // Case-insensitive partial match on name, email, or mobile
    const searchRegex = new RegExp(search, 'i');

    const users = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { mobile: { $regex: searchRegex } }
      ]
    }).select('name email mobile');

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




export const createTournament = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      registrationEndDate,
      location,
      locationName,
      numberOfTeams,
      format,
      tournamentType,
      rules,
      prizes,
      price,
      gameType,      // ✅ New field
      categoryId     // ✅ Conditional field
    } = req.body;

    // ✅ Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // ✅ Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check required fields

    // ✅ If tournamentType is 'paid', price is required
    if (tournamentType === 'paid' && (price === undefined || price === null)) {
      return res.status(400).json({ message: "Price is required for paid tournaments" });
    }

    // ✅ If gameType !== 'cricket', categoryId is required and must be valid
    if (gameType.toLowerCase() !== 'cricket') {
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: "Valid categoryId is required for non-cricket games" });
      }

      const categoryExists = await GameCategory.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({ message: "Game category not found" });
      }
    }

    // ✅ Set price
    const finalPrice = tournamentType === 'free' ? null : price;

    // ✅ Create tournament
    const newTournament = new Tournament({
      name,
      description,
      startDate,
      endDate,
      registrationEndDate,
      location,
      locationName,
      numberOfTeams,
      format,
      tournamentType,
      price: finalPrice,
      rules,
      prizes,
      createdBy: userId,
      gameType,
      categoryId: gameType.toLowerCase() === 'cricket' ? null : categoryId // ✅ Save only if needed
    });

    await newTournament.save();

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament: newTournament
    });

  } catch (error) {
    console.error("Error creating tournament:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


export const getAllTournaments = async (req, res) => {
  try {
    const { status } = req.query; // e.g. ?status=upcoming

    const query = {};

    if (status) {
      const allowedStatuses = ['upcoming', 'live', 'completed'];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      query.status = status.toLowerCase(); // case-insensitive
    }

    const tournaments = await Tournament.find(query)
      .sort({ createdAt: -1 }); // latest first

    return res.status(200).json({
      success: true,
      total: tournaments.length,
      tournaments
    });

  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const addTeamToTournament = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tournamentId, teamId } = req.body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(tournamentId) ||
      !mongoose.Types.ObjectId.isValid(teamId)
    ) {
      return res.status(400).json({ message: "Invalid user/tournament/team ID" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Defensive: Ensure teams is an array (initialize if undefined)
    if (!Array.isArray(tournament.teams)) {
      tournament.teams = [];
    }

    // Check if team already added
    if (tournament.teams.includes(teamId)) {
      return res.status(400).json({ message: "Team already added to tournament" });
    }

    // Add teamId to tournament's teams[]
    tournament.teams.push(teamId);
    await tournament.save();

    return res.status(200).json({
      success: true,
      message: "Team added to tournament successfully",
      tournament,
    });
  } catch (error) {
    console.error("Error adding team to tournament:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getTeamsByTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Validate tournamentId
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    // Find tournament and populate teams details
    const tournament = await Tournament.findById(tournamentId).populate('teams');

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Return teams array with full team details
    return res.status(200).json({
      success: true,
      tournamentId,
      teams: tournament.teams, // populated array
    });

  } catch (error) {
    console.error("Error fetching teams for tournament:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateLiveScore = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      runs,
      wickets,
      ballUpdate,
      striker,
      nonStriker,
      bowler,
      extraType,
      undoLastBall,
      changeBowler,
      swapStriker,
      innings = 1,
      newBatsman,
      dismissalType = 'bowled',
      matchStatus,
      inningStatus
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Match ID is required" });
    }

    // Database se match lo
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // ✅ SOCKET.IO INSTANCE
    const io = req.app.get("io");

    // ✅ SOCKET EMIT HELPER FUNCTION
    const emitLiveUpdate = (updateType, data) => {
      if (io) {
        const liveUpdateData = {
          type: updateType,
          matchId: id,
          data: data,
          timestamp: new Date().toISOString()
        };
        
        // ✅ YAHAN PE SIRF EMIT KARO - RESPONSE KE SAATH NAHI
        io.to(id).emit('live-score-update', liveUpdateData);
        io.emit('match-update', { matchId: id, ...liveUpdateData });
        
        console.log(`📡 Socket emit: ${updateType} for match ${id}`);
      }
    };

    // ✅ OVER HISTORY FORMATTING FUNCTION
    const getFormattedOverHistory = (overHistory) => {
      if (!overHistory || overHistory.length === 0) return [];
      
      return overHistory.map(over => {
        const validBalls = over.balls.filter(ball => ball && typeof ball.ballNumber !== 'undefined');
        const ballNumbers = validBalls.map(ball => ball.ballNumber).sort((a, b) => a - b);
        
        if (ballNumbers.length === 0) {
          return `Over ${over.overNumber}: No balls`;
        }
        
        return `Over ${over.overNumber}: ${over.runs} runs - ${ballNumbers.join(', ')}`;
      });
    };

    // ✅ PLAYER DETAILS FUNCTION - STRIKER, NON-STRIKER, BOWLER KA DATA LAO
    const getPlayerDetails = async (strikerId, nonStrikerId, bowlerId) => {
      const playerDetails = {};
      
      // Striker details
      if (strikerId) {
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (team) {
            const player = team.players.find(p => p._id.toString() === strikerId.toString());
            if (player) {
              playerDetails.striker = {
                id: player._id,
                name: player.name,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                strikeRate: 0
              };
              break;
            }
          }
        }
      }
      
      // Non-striker details
      if (nonStrikerId) {
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (team) {
            const player = team.players.find(p => p._id.toString() === nonStrikerId.toString());
            if (player) {
              playerDetails.nonStriker = {
                id: player._id,
                name: player.name,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                strikeRate: 0
              };
              break;
            }
          }
        }
      }
      
      // Bowler details
      if (bowlerId) {
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (team) {
            const player = team.players.find(p => p._id.toString() === bowlerId.toString());
            if (player) {
              playerDetails.bowler = {
                id: player._id,
                name: player.name,
                overs: 0,
                maidens: 0,
                runsConceded: 0,
                wickets: 0,
                economy: 0
              };
              break;
            }
          }
        }
      }
      
      return playerDetails;
    };

    // ✅ UPDATE PLAYER DETAILS WITH STATS
    const updatePlayerDetailsWithStats = (playerDetails, playersHistory) => {
      if (playerDetails.striker) {
        const strikerStats = playersHistory.find(p => 
          p.playerId && p.playerId.toString() === playerDetails.striker.id.toString()
        );
        if (strikerStats) {
          playerDetails.striker.runs = strikerStats.runs || 0;
          playerDetails.striker.balls = strikerStats.balls || 0;
          playerDetails.striker.fours = strikerStats.fours || 0;
          playerDetails.striker.sixes = strikerStats.sixes || 0;
          playerDetails.striker.strikeRate = strikerStats.strikeRate || 0;
        }
      }
      
      if (playerDetails.nonStriker) {
        const nonStrikerStats = playersHistory.find(p => 
          p.playerId && p.playerId.toString() === playerDetails.nonStriker.id.toString()
        );
        if (nonStrikerStats) {
          playerDetails.nonStriker.runs = nonStrikerStats.runs || 0;
          playerDetails.nonStriker.balls = nonStrikerStats.balls || 0;
          playerDetails.nonStriker.fours = nonStrikerStats.fours || 0;
          playerDetails.nonStriker.sixes = nonStrikerStats.sixes || 0;
          playerDetails.nonStriker.strikeRate = nonStrikerStats.strikeRate || 0;
        }
      }
      
      if (playerDetails.bowler) {
        const bowlerStats = playersHistory.find(p => 
          p.playerId && p.playerId.toString() === playerDetails.bowler.id.toString()
        );
        if (bowlerStats) {
          playerDetails.bowler.overs = bowlerStats.overs || 0;
          playerDetails.bowler.maidens = bowlerStats.maidens || 0;
          playerDetails.bowler.runsConceded = bowlerStats.runsConceded || 0;
          playerDetails.bowler.wickets = bowlerStats.wickets || 0;
          playerDetails.bowler.economy = bowlerStats.economy || 0;
        }
      }
      
      return playerDetails;
    };

    // ✅ UPDATE PLAYER STATUSES FUNCTION
    const updatePlayerStatus = (playerId, newStatus) => {
      if (!playerId || !match.playerStatuses) return;
      
      const playerStatusIndex = match.playerStatuses.findIndex(ps => 
        ps.playerId.toString() === playerId.toString()
      );
      
      if (playerStatusIndex !== -1) {
        match.playerStatuses[playerStatusIndex].playerStatus = newStatus;
        console.log(`🎯 PlayerStatus updated: ${playerId} -> ${newStatus}`);
      } else {
        // Agar playerStatuses mein nahi hai to add karo
        const teamId = [match.team1, match.team2].find(teamId => {
          const team = Team.findById(teamId);
          if (team) {
            return team.players.find(p => p._id.toString() === playerId.toString());
          }
          return false;
        });
        
        if (teamId) {
          match.playerStatuses.push({
            playerId: playerId,
            teamId: teamId,
            playerName: "Player", // Name baad mein update hoga
            playerStatus: newStatus
          });
          console.log(`🎯 New PlayerStatus added: ${playerId} -> ${newStatus}`);
        }
      }
    };

    // ✅ 1. MATCH STATUS UPDATE
    if (matchStatus) {
      match.status = matchStatus;
      if (matchStatus === 'completed') {
        match.endTime = new Date();
      } else if (matchStatus === 'live' && match.status === 'upcoming') {
        match.startTime = new Date();
      }
      
      await match.save();
      
      // ✅ FORMATTED OVER HISTORY SEND KARO
      const currentInningsIndex = innings - 1;
      const scoreData = match.scores[currentInningsIndex];
      const formattedOverHistory = scoreData ? getFormattedOverHistory(scoreData.overHistory) : [];
      
      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        match.playersHistory.find(inn => inn.innings === innings)?.players || []
      );

      const responseData = {
        success: true,
        message: `Match status updated to ${matchStatus}`,
        match: match,
        overHistory: formattedOverHistory,
        playerDetails: updatedPlayerDetails
      };

      // ✅ SIRF YAHAN SOCKET EMIT KARO
      emitLiveUpdate("MATCH_STATUS_UPDATE", responseData);
      
      return res.status(200).json(responseData);
    }

    // ✅ 2. INNING STATUS UPDATE
    if (inningStatus) {
      console.log(`🔄 Inning status update requested: ${inningStatus}`);
      
      match.inningStatus = inningStatus;
      
      if (inningStatus === 'innings break') {
        console.log(`🎯 Innings break started`);
        
        if (match.scores.length > 0) {
          const firstInnings = match.scores[0];
          match.target = firstInnings.runs + 1;
          console.log(`🎯 Target set: ${match.target} runs (First innings: ${firstInnings.runs} runs)`);
        } else {
          console.log(`❌ No first innings data found for target calculation`);
        }
        
        match.currentInnings = 1;
        match.currentStriker = null;
        match.nonStriker = null;
        match.currentBowler = null;
        match.runs = 0;
        match.wickets = 0;
        match.overs = 0;
        match.runRate = 0;
        
        // ✅ PLAYERSTATUSES RESET FOR INNINGS BREAK
        if (match.playerStatuses) {
          match.playerStatuses.forEach(status => {
            if (status.playerStatus.includes('Batting')) {
              status.playerStatus = "Fielding";
            }
          });
          console.log(`🎯 PlayerStatuses reset for innings break`);
        }
        
      } else if (inningStatus === 'second innings') {
        console.log(`🎯 Second innings starting...`);
        
        match.currentInnings = 2;
        
        if (!match.target || match.target === 0) {
          console.log(`⚠️ Target not set, calculating from first innings...`);
          if (match.scores.length > 0) {
            const firstInnings = match.scores[0];
            match.target = firstInnings.runs + 1;
            console.log(`🎯 Target calculated: ${match.target} runs`);
          }
        }
        
        if (match.scores.length < 2) {
          console.log(`🔄 Creating second innings data structure`);
          
          match.scores.push({
            innings: 2,
            runs: 0,
            wickets: 0,
            overs: 0,
            runRate: 0,
            currentOver: { 
              overNumber: 1, 
              runs: 0, 
              wickets: 0, 
              balls: [] 
            },
            overHistory: [],
            commentary: []
          });
          
          console.log(`✅ Second innings initialized successfully`);
        } else {
          const secondInnings = match.scores[1];
          secondInnings.runs = 0;
          secondInnings.wickets = 0;
          secondInnings.overs = 0;
          secondInnings.runRate = 0;
          secondInnings.currentOver = { 
            overNumber: 1, 
            runs: 0, 
            wickets: 0, 
            balls: [] 
          };
          secondInnings.overHistory = [];
          secondInnings.commentary = [];
          console.log(`🔄 Second innings data reset`);
        }
        
        if (!match.playersHistory.find(inn => inn.innings === 2)) {
          match.playersHistory.push({
            innings: 2,
            players: []
          });
          console.log(`✅ Players history created for second innings`);
        } else {
          const secondInningsHistory = match.playersHistory.find(inn => inn.innings === 2);
          secondInningsHistory.players = [];
          console.log(`🔄 Players history reset for second innings`);
        }
        
        match.runs = 0;
        match.wickets = 0;
        match.overs = 0;
        match.runRate = 0;
        
        console.log(`✅ Live data reset for second innings`);
        
        console.log(`🔄 Updating team schema for second innings...`);
        
        const firstInningsBattingTeam = match.scores[0] ? match.team1 : null;
        const battingTeam = firstInningsBattingTeam === match.team1 ? match.team2 : match.team1;
        const bowlingTeam = firstInningsBattingTeam === match.team1 ? match.team1 : match.team1;
        
        console.log(`🎯 Batting Team: ${battingTeam}, Bowling Team: ${bowlingTeam}`);
        
        // ✅ FIX: TUMHARE PAYLOAD KE STRIKER/NON-STRIKER/BOWLER USE KARO
        if (striker) {
          match.currentStriker = striker;
          updatePlayerStatus(striker, "Batting (Striker)");
          console.log(`🎯 Striker set from payload: ${striker}`);
        }
        
        if (nonStriker) {
          match.nonStriker = nonStriker;
          updatePlayerStatus(nonStriker, "Batting (Non-Striker)");
          console.log(`🎯 Non-Striker set from payload: ${nonStriker}`);
        }
        
        if (bowler) {
          match.currentBowler = bowler;
          updatePlayerStatus(bowler, "Bowling");
          console.log(`🎯 Bowler set from payload: ${bowler}`);
        }
        
        const battingTeamData = await Team.findById(battingTeam);
        if (battingTeamData) {
          console.log(`🔄 Resetting batting team: ${battingTeamData.teamName}`);
          
          battingTeamData.players = battingTeamData.players.map(player => ({
            ...player.toObject(),
            status: "Yet to Bat"
          }));
          
          // ✅ FIX: TUMHARE PAYLOAD KE STRIKER/NON-STRIKER KO SET KARO
          if (striker) {
            const strikerPlayer = battingTeamData.players.find(p => p._id.toString() === striker.toString());
            if (strikerPlayer) {
              strikerPlayer.status = "Batting (Striker)";
              console.log(`🎯 Striker status updated: ${striker}`);
            }
          }
          
          if (nonStriker) {
            const nonStrikerPlayer = battingTeamData.players.find(p => p._id.toString() === nonStriker.toString());
            if (nonStrikerPlayer) {
              nonStrikerPlayer.status = "Batting (Non-Striker)";
              console.log(`🎯 Non-Striker status updated: ${nonStriker}`);
            }
          }
          
          await battingTeamData.save();
          console.log(`✅ Batting team updated for second innings`);
        } else {
          console.log(`❌ Batting team not found`);
        }
        
        const bowlingTeamData = await Team.findById(bowlingTeam);
        if (bowlingTeamData) {
          console.log(`🔄 Resetting bowling team: ${bowlingTeamData.teamName}`);
          
          bowlingTeamData.players = bowlingTeamData.players.map(player => ({
            ...player.toObject(),
            status: "Fielding"
          }));
          
          // ✅ FIX: TUMHARE PAYLOAD KE BOWLER KO SET KARO
          if (bowler) {
            const bowlerPlayer = bowlingTeamData.players.find(p => p._id.toString() === bowler.toString());
            if (bowlerPlayer) {
              bowlerPlayer.status = "Bowling";
              console.log(`🎯 Bowler status updated: ${bowler}`);
            }
          }
          
          await bowlingTeamData.save();
          console.log(`✅ Bowling team updated for second innings`);
        } else {
          console.log(`❌ Bowling team not found`);
        }
        
        console.log(`🎯 Second innings setup completed. Target: ${match.target}`);
      }
      
      await match.save();
      
      // ✅ FORMATTED OVER HISTORY SEND KARO
      const currentInningsIndex = innings - 1;
      const scoreData = match.scores[currentInningsIndex];
      const formattedOverHistory = scoreData ? getFormattedOverHistory(scoreData.overHistory) : [];
      
      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        match.playersHistory.find(inn => inn.innings === innings)?.players || []
      );
      
      console.log(`✅ Inning status updated to ${inningStatus}, continuing with player updates...`);
      
      const responseData = {
        success: true,
        message: `Inning status updated to ${inningStatus}`,
        match: match,
        overHistory: formattedOverHistory,
        target: match.target,
        playerDetails: updatedPlayerDetails
      };

      // ✅ SIRF YAHAN SOCKET EMIT KARO
      emitLiveUpdate("INNING_STATUS_UPDATE", responseData);
      
      return res.status(200).json(responseData);
    }

    // ✅ 3. SWAP STRIKER
    if (swapStriker) {
      console.log(`🔄 Swapping striker and non-striker`);
      
      const temp = match.currentStriker;
      match.currentStriker = match.nonStriker;
      match.nonStriker = temp;

      // ✅ PLAYERSTATUSES UPDATE KARO
      if (match.currentStriker) {
        updatePlayerStatus(match.currentStriker, "Batting (Striker)");
      }
      if (match.nonStriker) {
        updatePlayerStatus(match.nonStriker, "Batting (Non-Striker)");
      }
      
      console.log(`✅ PlayerStatuses swapped: ${match.currentStriker} -> Striker, ${match.nonStriker} -> Non-Striker`);
      
      // Team schema mein bhi update karo
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (playerId === match.currentStriker?.toString()) {
            return { ...player.toObject(), status: "Batting (Striker)" };
          } else if (playerId === match.nonStriker?.toString()) {
            return { ...player.toObject(), status: "Batting (Non-Striker)" };
          }
          return player;
        });

        await team.save();
      }
      
      await match.save();
      
      // ✅ FORMATTED OVER HISTORY SEND KARO
      const currentInningsIndex = innings - 1;
      const scoreData = match.scores[currentInningsIndex];
      const formattedOverHistory = scoreData ? getFormattedOverHistory(scoreData.overHistory) : [];
      
      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        match.playersHistory.find(inn => inn.innings === innings)?.players || []
      );
      
      const responseData = {
        success: true,
        message: "Striker swapped successfully",
        match: match,
        overHistory: formattedOverHistory,
        playerDetails: updatedPlayerDetails
      };

      // ✅ SIRF YAHAN SOCKET EMIT KARO
      emitLiveUpdate("STRIKER_SWAP", responseData);
      
      return res.status(200).json(responseData);
    }

    // ✅ 4. BOWLER CHANGE
    if (bowler && changeBowler) {
      match.currentBowler = bowler;
      
      // ✅ PLAYERSTATUSES UPDATE KARO
      updatePlayerStatus(bowler, "Bowling");
      
      // Team schema mein bowler status update karo
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (player.status === "Bowling") {
            // Purane bowler ko Fielding karo
            updatePlayerStatus(player._id, "Fielding");
            return { ...player.toObject(), status: "Fielding" };
          }
          else if (playerId === bowler.toString()) {
            return { ...player.toObject(), status: "Bowling" };
          }
          return player;
        });

        await team.save();
      }
      
      await match.save();
      
      // ✅ FORMATTED OVER HISTORY SEND KARO
      const currentInningsIndex = innings - 1;
      const scoreData = match.scores[currentInningsIndex];
      const formattedOverHistory = scoreData ? getFormattedOverHistory(scoreData.overHistory) : [];
      
      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        match.playersHistory.find(inn => inn.innings === innings)?.players || []
      );
      
      const responseData = {
        success: true,
        message: "Bowler changed successfully",
        match: match,
        overHistory: formattedOverHistory,
        playerDetails: updatedPlayerDetails
      };

      // ✅ SIRF YAHAN SOCKET EMIT KARO
      emitLiveUpdate("BOWLER_CHANGE", responseData);
      
      return res.status(200).json(responseData);
    }

    // ✅ 5. UNDO LAST BALL
    if (undoLastBall) {
      console.log(`⏪ Undo last ball requested`);
      
      const scoreData = match.scores[innings - 1];
      if (!scoreData) {
        return res.status(400).json({
          success: false,
          message: "No innings data found to undo"
        });
      }

      // Check if there are any balls to undo
      if (scoreData.currentOver.balls.length === 0 && scoreData.overHistory.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No balls to undo"
        });
      }

      let lastBall;
      
      // Current over se last ball lo
      if (scoreData.currentOver.balls.length > 0) {
        lastBall = scoreData.currentOver.balls.pop();
      } 
      // Agar current over empty hai, to last over se ball lo
      else if (scoreData.overHistory.length > 0) {
        const lastOver = scoreData.overHistory[scoreData.overHistory.length - 1];
        if (lastOver.balls.length > 0) {
          lastBall = lastOver.balls.pop();
          
          // ✅ OVERHISTORY SE BHI REMOVE KARO - JAISE SCORES MEIN KIA HAI
          if (lastOver.balls.length === 0) {
            scoreData.overHistory.pop();
          }
        }
      }

      if (!lastBall) {
        return res.status(400).json({
          success: false,
          message: "No ball found to undo"
        });
      }

      console.log(`⏪ Undoing ball:`, lastBall);

      // ✅ RUNS UNDO KARO
      let runsToSubtract = lastBall.runs || 0;
      
      if (lastBall.extraType === 'noball') {
        runsToSubtract += 1;
      } else if (lastBall.extraType === 'wide') {
        runsToSubtract += 1;
      }

      scoreData.runs -= runsToSubtract;
      match.runs = scoreData.runs;

      // ✅ WICKET UNDO KARO
      if (lastBall.wicket) {
        scoreData.wickets -= 1;
        match.wickets = scoreData.wickets;

        // Players history se wicket undo karo
        const inningsHistory = match.playersHistory.find(inn => inn.innings === innings);
        if (inningsHistory) {
          const playersHistoryThisInnings = inningsHistory.players;
          
          if (lastBall.striker) {
            const strikerStats = playersHistoryThisInnings.find(p => 
              p.playerId && p.playerId.toString() === lastBall.striker.toString()
            );
            if (strikerStats) {
              strikerStats.isOut = false;
              strikerStats.dismissals = "";
              if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
                strikerStats.balls -= 1;
              }
            }
          }

          if (lastBall.bowler && lastBall.dismissalType && 
              ['bowled', 'caught', 'lbw', 'stumped', 'hitwicket'].includes(lastBall.dismissalType)) {
            const bowlerStats = playersHistoryThisInnings.find(p => 
              p.playerId && p.playerId.toString() === lastBall.bowler.toString()
            );
            if (bowlerStats) {
              bowlerStats.wickets -= 1;
            }
          }

          if (lastBall.newBatsman) {
            const newBatsmanStats = playersHistoryThisInnings.find(p => 
              p.playerId && p.playerId.toString() === lastBall.newBatsman.toString()
            );
            if (newBatsmanStats && newBatsmanStats.runs === 0 && newBatsmanStats.balls === 0) {
              inningsHistory.players = playersHistoryThisInnings.filter(p => 
                p.playerId.toString() !== lastBall.newBatsman.toString()
              );
            }
          }
        }

        // ✅ PLAYERSTATUSES UNDO KARO
        if (lastBall.striker) {
          updatePlayerStatus(lastBall.striker, "Batting (Striker)");
        }
        if (lastBall.newBatsman) {
          updatePlayerStatus(lastBall.newBatsman, "Fielding");
        }

        // Team schema mein player status undo karo
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (!team) continue;

          team.players = team.players.map((player) => {
            const playerId = player._id.toString();

            if (lastBall.striker && playerId === lastBall.striker.toString()) {
              return { ...player.toObject(), status: "Batting (Striker)" };
            }
            else if (lastBall.newBatsman && playerId === lastBall.newBatsman.toString()) {
              return { ...player.toObject(), status: "Fielding" };
            }
            return player;
          });

          await team.save();
        }

        match.currentStriker = lastBall.striker;
      }

      // ✅ PLAYER STATS UNDO KARO
      const inningsHistory = match.playersHistory.find(inn => inn.innings === innings);
      if (inningsHistory) {
        const playersHistoryThisInnings = inningsHistory.players;

        if (lastBall.striker && !lastBall.wicket) {
          const strikerStats = playersHistoryThisInnings.find(p => 
            p.playerId && p.playerId.toString() === lastBall.striker.toString()
          );
          if (strikerStats) {
            // ✅ BYE/LEGBYE RUNS BATSMAN KE RUNS SE SUBTRACT MAT KARO
            if (lastBall.extraType !== 'bye' && lastBall.extraType !== 'legbye') {
              strikerStats.runs -= (lastBall.runs || 0);
            }
            if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
              strikerStats.balls -= 1;
            }
            if (lastBall.runs === 4) strikerStats.fours -= 1;
            if (lastBall.runs === 6) strikerStats.sixes -= 1;
          }
        }

        if (lastBall.bowler) {
          const bowlerStats = playersHistoryThisInnings.find(p => 
            p.playerId && p.playerId.toString() === lastBall.bowler.toString()
          );
          if (bowlerStats) {
            let runsConcededToSubtract = lastBall.runs || 0;
            
            if (lastBall.extraType === 'noball') {
              runsConcededToSubtract += 1;
              bowlerStats.noBalls -= 1;
            } else if (lastBall.extraType === 'wide') {
              runsConcededToSubtract += 1;
              bowlerStats.wides -= 1;
            } else if (lastBall.extraType === 'bye') {
              bowlerStats.byes -= (lastBall.runs || 0);
            } else if (lastBall.extraType === 'legbye') {
              bowlerStats.legByes -= (lastBall.runs || 0);
            }
            
            bowlerStats.runsConceded -= runsConcededToSubtract;
            
            if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
              bowlerStats.balls -= 1;
            }
          }
        }
      }

      // ✅ OVER MANAGEMENT UNDO
      let runsToSubtractFromOver = lastBall.runs || 0;
      if (lastBall.extraType === 'noball' || lastBall.extraType === 'wide') {
        runsToSubtractFromOver += 1;
      }
      scoreData.currentOver.runs -= runsToSubtractFromOver;
      
      if (lastBall.wicket) {
        scoreData.currentOver.wickets -= 1;
      }

      // Over history update karo
      let currentOverInHistory = scoreData.overHistory.find(over => 
        over.overNumber === scoreData.currentOver.overNumber
      );
      if (currentOverInHistory) {
        currentOverInHistory.runs -= runsToSubtractFromOver;
        if (lastBall.wicket) currentOverInHistory.wickets -= 1;
        if (lastBall.extraType === 'wide') currentOverInHistory.wides -= 1;
        if (lastBall.extraType === 'noball') currentOverInHistory.noBalls -= 1;
        
        // ✅ OVERHISTORY SE BHI BALL REMOVE KARO
        const ballIndex = currentOverInHistory.balls.findIndex(ball => 
          ball.ballNumber === lastBall.ballNumber
        );
        if (ballIndex !== -1) {
          currentOverInHistory.balls.splice(ballIndex, 1);
        }
      }

      // ✅ OVERS COUNT UNDO
      let [ov, b] = scoreData.overs.toString().split(".").map(Number);
      
      if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
        b -= 1;
      }

      if (b < 0) {
        ov -= 1;
        b = 5;
      }

      scoreData.overs = parseFloat(`${ov}.${b}`);
      match.overs = scoreData.overs;

      // ✅ RUN RATE RECALCULATE KARO
      scoreData.runRate = scoreData.overs > 0 ? 
        parseFloat((scoreData.runs / scoreData.overs).toFixed(2)) : 0;
      match.runRate = scoreData.runRate;

      // ✅ COMMENTARY UNDO
      if (scoreData.commentary.length > 0) {
        scoreData.commentary.pop();
      }
      if (match.commentary.length > 0) {
        match.commentary.pop();
      }

      // ✅ MONGOOSE KO BATAYO KI SAB KUCH CHANGE HUA HAI
      match.markModified('scores');
      match.markModified('playersHistory');
      match.markModified('runs');
      match.markModified('wickets');
      match.markModified('overs');
      match.markModified('runRate');
      match.markModified('currentStriker');
      match.markModified('commentary');
      match.markModified('playerStatuses');

      console.log(`⏪ Undo completed. New score: ${scoreData.runs}/${scoreData.wickets} in ${scoreData.overs} overs`);
      
      const savedMatch = await match.save();
      
      // ✅ FORMATTED OVER HISTORY SEND KARO
      const formattedOverHistory = getFormattedOverHistory(scoreData.overHistory);
      
      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        match.playersHistory.find(inn => inn.innings === innings)?.players || []
      );
      
      const responseData = {
        success: true,
        message: "Last ball undone successfully",
        match: savedMatch,
        overHistory: formattedOverHistory,
        playerDetails: updatedPlayerDetails
      };

      // ✅ SIRF YAHAN SOCKET EMIT KARO
      emitLiveUpdate("UNDO_BALL", responseData);
      
      return res.status(200).json(responseData);
    }

    // ✅ 6. MAIN BALL UPDATE LOGIC (IMPORTANT: DIRECT PLAYER UPDATES SE PEHLE)
    if (ballUpdate) {
      console.log(`🎯 Ball update requested for innings ${innings}`);
      
      const currentInningsIndex = innings - 1;
      const isSecondInnings = innings === 2;
      
      console.log(`🎯 Ball update for innings ${innings}, Second innings: ${isSecondInnings}, Target: ${match.target}`);

      // ✅ FIX: FIRST TIME BALL UPDATE KE LIYE COMPLETE INITIALIZATION
      // Current innings ensure karo
      if (!match.scores[currentInningsIndex]) {
        console.log(`🆕 Creating new innings data for innings ${innings}`);
        match.scores[currentInningsIndex] = {
          innings: innings,
          runs: 0,
          wickets: 0,
          overs: 0,
          runRate: 0,
          currentOver: { overNumber: 1, runs: 0, wickets: 0, balls: [] },
          overHistory: [],
          commentary: []
        };
      }

      const scoreData = match.scores[currentInningsIndex];

      // ✅ FIX: FIRST TIME PLAYERS HISTORY INITIALIZATION
      // PlayersHistory ensure karo
      let inningsHistory = match.playersHistory.find(inn => inn.innings === innings);
      if (!inningsHistory) {
        console.log(`🆕 Creating new players history for innings ${innings}`);
        inningsHistory = {
          innings: innings,
          players: []
        };
        match.playersHistory.push(inningsHistory);
      }

      const playersHistoryThisInnings = inningsHistory.players;

      // ✅ FIX: FIRST TIME STRIKER/NON-STRIKER/BOWLER INITIALIZATION
      if (striker && !match.currentStriker) {
        console.log(`🆕 Setting initial striker: ${striker}`);
        match.currentStriker = striker;
        updatePlayerStatus(striker, "Batting (Striker)");
      }
      
      if (nonStriker && !match.nonStriker) {
        console.log(`🆕 Setting initial non-striker: ${nonStriker}`);
        match.nonStriker = nonStriker;
        updatePlayerStatus(nonStriker, "Batting (Non-Striker)");
      }
      
      if (bowler && !match.currentBowler) {
        console.log(`🆕 Setting initial bowler: ${bowler}`);
        match.currentBowler = bowler;
        updatePlayerStatus(bowler, "Bowling");
      }

      // ✅ SIMPLER SOLUTION: Ball number calculation based on ball count
      const getNextBallNumber = () => {
        const currentBalls = scoreData.currentOver.balls;
        
        // ✅ SIMPLE FIX: Just return current balls count + 1
        const nextBall = currentBalls.length + 1;
        console.log(`🎯 Current balls: ${currentBalls.length}, Next ball number: ${nextBall}`);
        return nextBall;
      };

      // ✅ IMPROVED PLAYER UPDATE FUNCTION WITH VALIDATION
      const updatePlayerStats = (playerId, updates) => {
        if (!playerId) {
          console.log(`⚠️ Player ID undefined, skipping update`);
          return null;
        }

        let playerStats = playersHistoryThisInnings.find(p => 
          p.playerId && p.playerId.toString() === playerId.toString()
        );

        if (!playerStats) {
          playerStats = {
            playerId: playerId,
            runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0,
            wickets: 0, overs: 0, runsConceded: 0, maidens: 0, economy: 0,
            wides: 0, noBalls: 0, byes: 0, legByes: 0, dismissals: "", isOut: false
          };
          playersHistoryThisInnings.push(playerStats);
          console.log(`🆕 New player added to history: ${playerId}`);
        }

        // ✅ STATS UPDATE - ONLY ONCE PER BALL
        if (updates.runs !== undefined) {
          playerStats.runs += updates.runs;
          if (updates.runs === 4) playerStats.fours += 1;
          if (updates.runs === 6) playerStats.sixes += 1;
          console.log(`📈 Player ${playerId} runs: +${updates.runs} = ${playerStats.runs}`);
        }
        
        if (updates.balls !== undefined && updates.balls > 0) {
          playerStats.balls += updates.balls;
          console.log(`📈 Player ${playerId} balls: +${updates.balls} = ${playerStats.balls}`);
        }
        
        if (updates.runsConceded !== undefined) {
          playerStats.runsConceded += updates.runsConceded;
          console.log(`📈 Player ${playerId} runsConceded: +${updates.runsConceded} = ${playerStats.runsConceded}`);
        }
        
        if (updates.wickets !== undefined) {
          playerStats.wickets += updates.wickets;
          console.log(`📈 Player ${playerId} wickets: +${updates.wickets} = ${playerStats.wickets}`);
        }
        
        if (updates.overs !== undefined) {
          playerStats.overs += updates.overs;
          console.log(`📈 Player ${playerId} overs: +${updates.overs} = ${playerStats.overs}`);
        }
        
        if (updates.wides !== undefined) {
          playerStats.wides += updates.wides;
        }
        
        if (updates.noBalls !== undefined) {
          playerStats.noBalls += updates.noBalls;
        }
        
        if (updates.byes !== undefined) {
          playerStats.byes += updates.byes;
        }
        
        if (updates.legByes !== undefined) {
          playerStats.legByes += updates.legByes;
        }
        
        if (updates.dismissal) {
          playerStats.dismissals = updates.dismissal;
        }
        
        if (updates.isOut !== undefined) {
          playerStats.isOut = updates.isOut;
        }

        // ✅ RATES CALCULATE KARO
        if (playerStats.balls > 0) {
          playerStats.strikeRate = parseFloat(((playerStats.runs / playerStats.balls) * 100).toFixed(2));
        }
        if (playerStats.overs > 0) {
          playerStats.economy = parseFloat((playerStats.runsConceded / playerStats.overs).toFixed(2));
        }

        console.log(`✅ Player ${playerId} updated - R:${playerStats.runs}, B:${playerStats.balls}, O:${playerStats.overs}, RC:${playerStats.runsConceded}`);
        return playerStats;
      };

      // ✅ FIXED: BALL UPDATE LOGIC - OVERHISTORY KE ACCORDING
      let ballRuns = Number(runs) || 0;
      let ballWicket = (Number(wickets) || 0) > 0;
      let isLegalDelivery = true;
      let commentaryLine = "";

      if (extraType === 'wide' || extraType === 'noball') {
        isLegalDelivery = false;
      }

      // ✅ RUNS ADD KARO - OVERHISTORY KE ACCORDING
      if (runs !== undefined) {
        let runsToAdd = ballRuns;
        
        if (extraType === 'noball') {
          runsToAdd = ballRuns + 1;
          console.log(`🎯 No Ball: ${ballRuns} boundary runs + 1 penalty = ${runsToAdd} total runs`);
        }
        else if (extraType === 'wide') {
          runsToAdd = ballRuns + 1;
          console.log(`🎯 Wide: ${ballRuns} extra runs + 1 penalty = ${runsToAdd} total runs`);
        }

        scoreData.runs += runsToAdd;
        match.runs = scoreData.runs;

        // ✅ FIX: ONLY ONE TIME PLAYER STATS UPDATE KARO
        if (!extraType) {
          // ✅ NORMAL BALL - STRIKER KO RUNS AUR BALLS
          if (striker) {
            updatePlayerStats(striker, { 
              runs: ballRuns, 
              balls: 1
            });
          }
          // ✅ BOWLER KO RUNS CONCEDED AUR BALLS
          if (bowler) {
            updatePlayerStats(bowler, { 
              runsConceded: ballRuns, 
              balls: 1
            });
          }
          
          if (ballRuns === 0) commentaryLine = "Dot ball";
          else if (ballRuns === 4) commentaryLine = "FOUR!";
          else if (ballRuns === 6) commentaryLine = "SIX!";
          else commentaryLine = `${ballRuns} run${ballRuns > 1 ? 's' : ''}`;
        }
        else {
          switch (extraType) {
            case 'wide':
              if (bowler) {
                updatePlayerStats(bowler, { 
                  runsConceded: runsToAdd,
                  wides: 1
                });
              }
              commentaryLine = `WIDE! ${runsToAdd} run${runsToAdd > 1 ? 's' : ''}${ballRuns > 0 ? ` (${ballRuns} boundary)` : ''}`;
              break;
              
            case 'noball':
              if (bowler) {
                updatePlayerStats(bowler, { 
                  runsConceded: runsToAdd,
                  noBalls: 1
                });
              }
              if (striker && ballRuns > 0) {
                updatePlayerStats(striker, { 
                  runs: ballRuns
                });
              }
              commentaryLine = `NO BALL! ${runsToAdd} run${runsToAdd > 1 ? 's' : ''}${ballRuns > 0 ? ` (${ballRuns} boundary)` : ''}`;
              break;
              
            case 'bye':
              if (bowler && isLegalDelivery) {
                updatePlayerStats(bowler, { 
                  balls: 1,
                  byes: ballRuns,
                  runsConceded: ballRuns
                });
              }
              // ✅ BYE RUNS BATSMAN KO NAHI MILENGE - SIRF TEAM EXTRAS MEIN JAYENGE
              commentaryLine = `${ballRuns} BYE${ballRuns > 1 ? 's' : ''}`;
              break;
              
            case 'legbye':
              if (bowler && isLegalDelivery) {
                updatePlayerStats(bowler, { 
                  balls: 1,
                  legByes: ballRuns,
                  runsConceded: ballRuns
                });
              }
              // ✅ LEGBYE RUNS BATSMAN KO NAHI MILENGE - SIRF TEAM EXTRAS MEIN JAYENGE
              commentaryLine = `${ballRuns} LEG BYE${ballRuns > 1 ? 's' : ''}`;
              break;
          }
        }
      }

      // ✅ WICKET ADD KARO
      if (ballWicket) {
        scoreData.wickets += 1;
        match.wickets = scoreData.wickets;

        console.log(`🎯 Wicket taken! Dismissal Type: ${dismissalType}, Striker: ${striker}`);

        if (striker) {
          updatePlayerStats(striker, { 
            dismissal: dismissalType, 
            balls: isLegalDelivery ? 1 : 0,
            isOut: true 
          });

          // ✅ PLAYERSTATUSES UPDATE FOR WICKET
          updatePlayerStatus(striker, "Out");

          switch(dismissalType) {
            case 'bowled':
              commentaryLine = `BOWLED! Clean bowled!`;
              break;
            case 'caught':
              commentaryLine = `CAUGHT! Brilliant catch!`;
              break;
            case 'lbw':
              commentaryLine = `LBW! Plumb in front!`;
              break;
            case 'runout':
              commentaryLine = `RUN OUT! Direct hit!`;
              break;
            case 'stumped':
              commentaryLine = `STUMPED! Quick work by the keeper!`;
              break;
            case 'hitwicket':
              commentaryLine = `HIT WICKET! Unfortunate dismissal!`;
              break;
            default:
              commentaryLine = `OUT! ${dismissalType}`;
          }
        }

        if (bowler && isLegalDelivery && 
          ['bowled', 'caught', 'lbw', 'stumped', 'hitwicket'].includes(dismissalType)) {
          updatePlayerStats(bowler, { wickets: 1 });
          console.log(`🎯 Wicket credited to bowler: ${bowler}`);
        }

        if (newBatsman) {
          match.currentStriker = newBatsman;
          updatePlayerStats(newBatsman, { runs: 0, balls: 0, isOut: false });
          
          // ✅ PLAYERSTATUSES UPDATE FOR NEW BATSMAN
          updatePlayerStatus(newBatsman, "Batting (Striker)");
          
          commentaryLine += ` New batsman arrives.`;
          console.log(`🔄 New batsman: ${newBatsman}`);
        } else {
          match.currentStriker = null;
        }

        console.log(`🔄 Updating team schema for wicket...`);
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (!team) continue;

          team.players = team.players.map((player) => {
            const playerId = player._id.toString();

            if (striker && playerId === striker.toString()) {
              console.log(`🎯 Marking player as OUT: ${playerId}`);
              return { ...player.toObject(), status: "Out" };
            }
            else if (newBatsman && playerId === newBatsman.toString()) {
              console.log(`🔄 New batsman status: Batting (Striker) - ${playerId}`);
              return { ...player.toObject(), status: "Batting (Striker)" };
            }
            return player;
          });

          await team.save();
          console.log(`✅ Team ${team.teamName} updated successfully`);
        }
      }

      // ✅ FIXED: BALL NUMBER CALCULATION
      const nextBallNumber = getNextBallNumber();
      console.log(`🎯 Final Ball Number: ${nextBallNumber}, Extra Type: ${extraType}, Legal Delivery: ${isLegalDelivery}`);

      // ✅ OVER MANAGEMENT
      const ballData = {
        ballNumber: nextBallNumber,
        runs: ballRuns,
        wicket: ballWicket,
        extraType: extraType,
        striker: striker,
        bowler: bowler,
        newBatsman: ballWicket ? newBatsman : null,
        dismissalType: ballWicket ? dismissalType : null,
        timestamp: new Date(),
        commentary: commentaryLine
      };

      // ✅ ONLY ONCE PUSH KARO CURRENT OVER MEIN
      scoreData.currentOver.balls.push(ballData);

      if (extraType === 'noball') {
        scoreData.currentOver.runs += (ballRuns + 1);
      } else if (extraType === 'wide') {
        scoreData.currentOver.runs += (ballRuns + 1);
      } else {
        scoreData.currentOver.runs += ballRuns;
      }
      
      if (ballWicket) scoreData.currentOver.wickets += 1;

      // ✅ OVER HISTORY UPDATE - DIRECT COPY CURRENT OVER
      const overIndex = scoreData.overHistory.findIndex(over => 
        over.overNumber === scoreData.currentOver.overNumber
      );

      if (overIndex === -1) {
        scoreData.overHistory.push({
          ...scoreData.currentOver,
          balls: [...scoreData.currentOver.balls],
          wides: scoreData.currentOver.balls.filter(b => b.extraType === 'wide').length,
          noBalls: scoreData.currentOver.balls.filter(b => b.extraType === 'noball').length,
          byes: scoreData.currentOver.balls.filter(b => b.extraType === 'bye').reduce((sum, ball) => sum + (ball.runs || 0), 0),
          legByes: scoreData.currentOver.balls.filter(b => b.extraType === 'legbye').reduce((sum, ball) => sum + (ball.runs || 0), 0)
        });
      } else {
        scoreData.overHistory[overIndex] = {
          ...scoreData.currentOver,
          balls: [...scoreData.currentOver.balls],
          wides: scoreData.currentOver.balls.filter(b => b.extraType === 'wide').length,
          noBalls: scoreData.currentOver.balls.filter(b => b.extraType === 'noball').length,
          byes: scoreData.currentOver.balls.filter(b => b.extraType === 'bye').reduce((sum, ball) => sum + (ball.runs || 0), 0),
          legByes: scoreData.currentOver.balls.filter(b => b.extraType === 'legbye').reduce((sum, ball) => sum + (ball.runs || 0), 0)
        };
      }

      console.log(`✅ Over History Updated: Over ${scoreData.currentOver.overNumber} - ${scoreData.currentOver.balls.length} balls`);

      // ✅ OVERS COUNT UPDATE
      let [ov, b] = scoreData.overs.toString().split(".").map(Number);
      if (isNaN(ov)) ov = 0;
      if (isNaN(b)) b = 0;

      if (isLegalDelivery) {
        b += 1;
      }

      // ✅ OVER COMPLETE?
      if (b >= 6) {
        console.log(`🎯 Over completed! Bowler: ${bowler}, Over: ${ov}.${b}`);
        
        if (bowler) {
          updatePlayerStats(bowler, { overs: 1 });
          
          const currentOverRuns = scoreData.currentOver.runs;
          if (currentOverRuns === 0) {
            updatePlayerStats(bowler, { maidens: 1 });
            console.log(`🎯 Maiden over for bowler: ${bowler}`);
          }
          
          const bowlerStats = playersHistoryThisInnings.find(p => 
            p.playerId && p.playerId.toString() === bowler.toString()
          );
          console.log(`📊 Bowler ${bowler} overs updated to: ${bowlerStats?.overs || 0}`);
        }

        ov += 1;
        b = 0;
        scoreData.currentOver = {
          overNumber: ov + 1,
          runs: 0,
          wickets: 0,
          balls: []
        };

        const overCommentary = `End of over ${ov}. Score: ${scoreData.runs}/${scoreData.wickets}`;
        scoreData.commentary.push(overCommentary);
        match.commentary.push(overCommentary);
        
        console.log(`🔄 Starting new over: ${ov + 1}`);
      }

      scoreData.overs = parseFloat(`${ov}.${b}`);
      match.overs = scoreData.overs;

      scoreData.runRate = scoreData.overs > 0 ? 
        parseFloat((scoreData.runs / scoreData.overs).toFixed(2)) : 0;
      match.runRate = scoreData.runRate;

      // ✅ CURRENT PLAYERS UPDATE - FIXED FOR FIRST TIME
      if (striker && !ballWicket) {
        match.currentStriker = striker;
        
        // ✅ PLAYERSTATUSES UPDATE
        updatePlayerStatus(striker, "Batting (Striker)");
        
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (!team) continue;

          team.players = team.players.map((player) => {
            const playerId = player._id.toString();

            if (playerId === striker.toString()) {
              return { ...player.toObject(), status: "Batting (Striker)" };
            }
            return player;
          });

          await team.save();
        }
      }
      
      if (nonStriker) {
        match.nonStriker = nonStriker;
        
        // ✅ PLAYERSTATUSES UPDATE
        updatePlayerStatus(nonStriker, "Batting (Non-Striker)");
        
        // ✅ FIX: NON-STRIKER KO BHI PLAYERS HISTORY MEIN ADD KARO
        updatePlayerStats(nonStriker, { runs: 0, balls: 0 });
        
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (!team) continue;

          team.players = team.players.map((player) => {
            const playerId = player._id.toString();

            if (playerId === nonStriker.toString()) {
              return { ...player.toObject(), status: "Batting (Non-Striker)" };
            }
            return player;
          });

          await team.save();
        }
      }
      
      if (bowler && !changeBowler) {
        match.currentBowler = bowler;
        
        // ✅ PLAYERSTATUSES UPDATE
        updatePlayerStatus(bowler, "Bowling");
        
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (!team) continue;

          team.players = team.players.map((player) => {
            const playerId = player._id.toString();

            if (playerId === bowler.toString()) {
              return { ...player.toObject(), status: "Bowling" };
            }
            return player;
          });

          await team.save();
        }
      }

      // ✅ COMMENTARY ADD KARO
      if (commentaryLine) {
        scoreData.commentary.push(commentaryLine);
        match.commentary.push(commentaryLine);
      }

      // ✅ MONGOOSE KO BATAYO KI SAB KUCH CHANGE HUA HAI
      match.markModified('scores');
      match.markModified('playersHistory');
      match.markModified('runs');
      match.markModified('wickets');
      match.markModified('overs');
      match.markModified('runRate');
      match.markModified('currentStriker');
      match.markModified('nonStriker');
      match.markModified('currentBowler');
      match.markModified('commentary');
      match.markModified('playerStatuses');

      console.log(`💾 Saving match data...`);
      console.log(`📊 Final Score: ${scoreData.runs}/${scoreData.wickets} in ${scoreData.overs} overs`);
      
      // ✅ DEBUG OVER HISTORY
      console.log(`📈 Current Over Balls:`, scoreData.currentOver.balls.map(b => `Ball ${b.ballNumber}: ${b.runs} runs`));
      console.log(`📈 Over History:`, scoreData.overHistory.map(over => `Over ${over.overNumber}: ${over.balls.length} balls - ${over.balls.map(b => b.ballNumber).join(', ')}`));
      
      // ✅ DEBUG PLAYER STATS
      console.log(`🔍 FINAL PLAYER STATS:`);
      playersHistoryThisInnings.forEach(player => {
        console.log(`   Player: ${player.playerId}, Runs: ${player.runs}, Balls: ${player.balls}, Overs: ${player.overs}, RunsConceded: ${player.runsConceded}`);
      });
      
      if (bowler) {
        const bowlerStats = playersHistoryThisInnings.find(p => 
          p.playerId && p.playerId.toString() === bowler.toString()
        );
        if (bowlerStats) {
          console.log(`🎯 Bowler Final Stats - Overs: ${bowlerStats.overs}, Runs: ${bowlerStats.runsConceded}, Wickets: ${bowlerStats.wickets}`);
        }
      }

      const savedMatch = await match.save();
      console.log(`✅ Match saved successfully!`);

      // ✅ FORMATTED OVER HISTORY SEND KARO
      const formattedOverHistory = getFormattedOverHistory(scoreData.overHistory);

      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        playersHistoryThisInnings
      );

      const responseData = {
        success: true,
        message: "Ball updated successfully",
        match: savedMatch,
        overHistory: formattedOverHistory,
        playerDetails: updatedPlayerDetails
      };

      if (isSecondInnings) {
        responseData.target = match.target;
        responseData.requiredRuns = Math.max(0, match.target - scoreData.runs);
        responseData.remainingWickets = 10 - scoreData.wickets;
        console.log(`🎯 Second innings update - Target: ${match.target}, Required: ${responseData.requiredRuns}`);
      }

      // ✅ SIRF YAHAN SOCKET EMIT KARO - BALL UPDATE KE LIYE
      emitLiveUpdate("BALL_UPDATE", responseData);
      
      return res.status(200).json(responseData);
    }

    // ✅ 7. DIRECT PLAYER UPDATES (BALL UPDATE KE BAAD - ONLY IF NOT BALL UPDATE)
    let playersUpdated = false;

    if (striker && striker !== match.currentStriker?.toString()) {
      console.log(`🔄 Updating striker from ${match.currentStriker} to ${striker}`);
      match.currentStriker = striker;
      playersUpdated = true;
      
      // ✅ PLAYERSTATUSES UPDATE
      updatePlayerStatus(striker, "Batting (Striker)");
      
      // Team schema update for striker
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (playerId === striker.toString()) {
            return { ...player.toObject(), status: "Batting (Striker)" };
          }
          else if (player.status === "Batting (Striker)" && playerId !== striker.toString()) {
            return { ...player.toObject(), status: "Batting (Non-Striker)" };
          }
          return player;
        });

        await team.save();
      }
      console.log(`✅ Striker updated to: ${striker}`);
    }
    
    if (nonStriker && nonStriker !== match.nonStriker?.toString()) {
      console.log(`🔄 Updating non-striker from ${match.nonStriker} to ${nonStriker}`);
      match.nonStriker = nonStriker;
      playersUpdated = true;
      
      // ✅ PLAYERSTATUSES UPDATE
      updatePlayerStatus(nonStriker, "Batting (Non-Striker)");
      
      // Team schema update for non-striker
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (playerId === nonStriker.toString()) {
            return { ...player.toObject(), status: "Batting (Non-Striker)" };
          }
          return player;
        });

        await team.save();
      }
      console.log(`✅ Non-striker updated to: ${nonStriker}`);
    }
    
    if (bowler && bowler !== match.currentBowler?.toString() && !changeBowler) {
      console.log(`🔄 Updating bowler from ${match.currentBowler} to ${bowler}`);
      match.currentBowler = bowler;
      playersUpdated = true;
      
      // ✅ PLAYERSTATUSES UPDATE
      updatePlayerStatus(bowler, "Bowling");
      
      // Team schema update for bowler
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (playerId === bowler.toString()) {
            return { ...player.toObject(), status: "Bowling" };
          }
          else if (player.status === "Bowling" && playerId !== bowler.toString()) {
            return { ...player.toObject(), status: "Fielding" };
          }
          return player;
        });

        await team.save();
      }
      console.log(`✅ Bowler updated to: ${bowler}`);
    }
    
    if (playersUpdated) {
      await match.save();
      
      // ✅ FORMATTED OVER HISTORY SEND KARO
      const currentInningsIndex = innings - 1;
      const scoreData = match.scores[currentInningsIndex];
      const formattedOverHistory = scoreData ? getFormattedOverHistory(scoreData.overHistory) : [];
      
      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        match.playersHistory.find(inn => inn.innings === innings)?.players || []
      );
      
      const responseData = {
        success: true,
        message: "Players updated successfully",
        match: match,
        target: match.target,
        overHistory: formattedOverHistory,
        playerDetails: updatedPlayerDetails
      };

      // ✅ SIRF YAHAN SOCKET EMIT KARO
      emitLiveUpdate("PLAYER_UPDATE", responseData);
      
      return res.status(200).json(responseData);
    }

    // ✅ 8. STRIKER CHANGE (without wicket)
    if (striker && newBatsman && !wickets) {
      console.log(`🔄 Changing striker from ${match.currentStriker} to ${newBatsman}`);
      
      match.currentStriker = newBatsman;
      
      // ✅ PLAYERSTATUSES UPDATE
      updatePlayerStatus(newBatsman, "Batting (Striker)");
      
      // Team schema mein player status update karo
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (player.status === "Batting (Striker)") {
            updatePlayerStatus(player._id, "Fielding");
            return { ...player.toObject(), status: "Fielding" };
          }
          else if (playerId === newBatsman.toString()) {
            return { ...player.toObject(), status: "Batting (Striker)" };
          }
          return player;
        });

        await team.save();
      }
      
      await match.save();
      
      // ✅ FORMATTED OVER HISTORY SEND KARO
      const currentInningsIndex = innings - 1;
      const scoreData = match.scores[currentInningsIndex];
      const formattedOverHistory = scoreData ? getFormattedOverHistory(scoreData.overHistory) : [];
      
      // ✅ PLAYER DETAILS ADD KARO RESPONSE MEIN
      const playerDetails = await getPlayerDetails(
        match.currentStriker, 
        match.nonStriker, 
        match.currentBowler
      );
      const updatedPlayerDetails = updatePlayerDetailsWithStats(
        playerDetails, 
        match.playersHistory.find(inn => inn.innings === innings)?.players || []
      );
      
      const responseData = {
        success: true,
        message: "Striker changed successfully",
        match: match,
        overHistory: formattedOverHistory,
        playerDetails: updatedPlayerDetails
      };

      // ✅ SIRF YAHAN SOCKET EMIT KARO
      emitLiveUpdate("STRIKER_CHANGE", responseData);
      
      return res.status(200).json(responseData);
    }

    // Agar koi valid action nahi hai
    return res.status(400).json({
      success: false,
      message: "No valid update action provided"
    });

  } catch (error) {
    console.error("Update Live Score Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating live score",
      error: error.message
    });
  }
};
export const createTeamWithCategory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { categoryId, teamName, players } = req.body;

    // 🔎 Validate creator
    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({ success: false, message: 'User (creator) not found' });
    }

    // 🔎 Validate category
    const category = await GameCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // 🔒 Validate inputs
    if (!teamName || !players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Team name and players are required',
      });
    }

    const playerEntries = [];

    for (const name of players) {
      let existingUser = await User.findOne({ name });

      if (!existingUser) {
        existingUser = await User.create({ name });
      }

      playerEntries.push({
        userId: existingUser._id,
        name: existingUser.name,
      });
    }

    // 🛠️ Create new team with creator's userId and full player info
    const newTeam = new GameTeam({
      teamName,
      categoryId,
      userId,
      players: playerEntries
    });

    await newTeam.save();

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: {
        _id: newTeam._id,
        teamName: newTeam.teamName,
        categoryId: newTeam.categoryId,
        userId: newTeam.userId,
        players: newTeam.players
      }
    });

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



export const getAllGamesTeams = async (req, res) => {
  try {
    const teams = await GameTeam.find()
      .populate('categoryId', 'name') // get category name
      .populate('userId', 'name email') // get creator info
      .populate('players.userId', 'name email'); // get player info

    res.status(200).json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



export const getTeamsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { playerName, teamName } = req.query;  // Accept both playerName and teamName as query parameters

    console.log('Received categoryId:', categoryId);
    console.log('Received playerName:', playerName);
    console.log('Received teamName:', teamName);

    // Step 1: Fetch all teams under category
    let teams = await GameTeam.find({ categoryId })
      .populate('categoryId', 'name')
      .populate('userId', 'name email')
      .populate('players.userId', 'name email');

    console.log('Fetched teams:', teams); // This will show all the teams fetched from the database

    // Step 2: If playerName is provided, filter teams by player name
    if (playerName) {
      const searchLower = playerName.toLowerCase();
      console.log("Filtering by playerName:", playerName);

      teams = teams.filter(team => {
        const hasMatchingPlayer = team.players.some(player => {
          const userName = player.userId?.name?.toLowerCase() || '';
          const playerNameField = player.name?.toLowerCase() || '';
          const match = userName.includes(searchLower) || playerNameField.includes(searchLower);

          console.log("Checking player:", { userName, playerNameField, match });

          return match;
        });
        return hasMatchingPlayer;
      });
    }

    // Step 3: If teamName is provided, filter teams by team name (case-insensitive)
    if (teamName) {
      const teamSearchLower = teamName.toLowerCase().trim(); // Trim any extra spaces
      console.log("Filtering by teamName:", teamName);

      teams = teams.filter(team => {
        const teamNameMatch = team.teamName?.toLowerCase().includes(teamSearchLower) || false;

        console.log("Checking team:", { teamName: team.teamName, teamNameMatch });

        return teamNameMatch;
      });
    }

    console.log('Filtered teams:', teams);

    // Final response with filtered teams
    res.status(200).json({
      success: true,
      count: teams.length,
      teams
    });

  } catch (error) {
    console.error('Error fetching teams by category:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




export const createMatchForGame = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      categoryId,
      scoringMethod,
      gameMode,
      players,
      teams,
      tournamentId,
      type,

      // 👇 NEW FIELDS
      extraTimeAllowedForHalfTime,
      extraTimeDurationForHalfTime,
      extraTimeAllowedForFullTime,
      extraTimeDurationForFullTime
    } = req.body;

    // Existing validation logic...
    const creator = await User.findById(userId);
    if (!creator) return res.status(404).json({ success: false, message: 'Creator not found' });

    const category = await GameCategory.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (!scoringMethod || !gameMode) {
      return res.status(400).json({ success: false, message: 'Scoring method and game mode are required' });
    }

    if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    let playerEntries = [];
    if (gameMode === 'single') {
      if (!players || !Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ success: false, message: 'Players array is required for single game mode' });
      }

      for (const playerName of players) {
        let existingUser = await User.findOne({ name: playerName });
        if (!existingUser) {
          existingUser = await User.create({ name: playerName });
        }
        playerEntries.push(existingUser.name);
      }
    }

    let teamEntries = [];
    if (gameMode === 'team') {
      if (!teams || !Array.isArray(teams) || teams.length < 2) {
        return res.status(400).json({ success: false, message: 'At least two teams are required for team game mode' });
      }

      for (const team of teams) {
        const existingTeam = await GameTeam.findById(team.teamId);
        if (!existingTeam) {
          return res.status(404).json({ success: false, message: `Team with ID ${team.teamId} not found` });
        }
        teamEntries.push({ teamId: existingTeam._id });
      }
    }

    // ✅ Create the match with the new fields
    const newMatch = new GameMatch({
      name,
      categoryId,
      scoringMethod,
      gameMode,
      players: playerEntries,
      teams: teamEntries,
      tournamentId: tournamentId || null,
      createdBy: creator._id,
      status: 'upcoming',
      createdAt: new Date(),

      // 👇 New fields being saved
      extraTimeAllowedForHalfTime: extraTimeAllowedForHalfTime || false,
      extraTimeDurationForHalfTime: extraTimeDurationForHalfTime || 0,
      extraTimeAllowedForFullTime: extraTimeAllowedForFullTime || false,
      extraTimeDurationForFullTime: extraTimeDurationForFullTime || 0,
    });

    await newMatch.save();

    return res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match: {
        _id: newMatch._id,
        name: newMatch.name,
        categoryId: newMatch.categoryId,
        scoringMethod: newMatch.scoringMethod,
        gameMode: newMatch.gameMode,
        players: newMatch.players,
        teams: newMatch.teams,
        tournamentId: newMatch.tournamentId,
        status: newMatch.status,
        createdBy: newMatch.createdBy,

        // 👇 Return new fields
        extraTimeAllowedForHalfTime: newMatch.extraTimeAllowedForHalfTime,
        extraTimeDurationForHalfTime: newMatch.extraTimeDurationForHalfTime,
        extraTimeAllowedForFullTime: newMatch.extraTimeAllowedForFullTime,
        extraTimeDurationForFullTime: newMatch.extraTimeDurationForFullTime,
      },
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




export const startGameMatch = async (req, res) => {
  try {
    const { userId, matchId } = req.params;
    const {
      startKickTime,
      totalDuration,
      halfTimeDuration,

      // ✅ NEW FIELDS
      extraTimeAllowedForHalfTime,
      extraTimeDurationForHalfTime,
      extraTimeAllowedForFullTime,
      extraTimeDurationForFullTime
    } = req.body;

    // ✅ Validate matchId
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ success: false, message: "Invalid match ID ❌" });
    }

    // ✅ Fetch the match
    const match = await GameMatch.findById(matchId).populate('teams.teamId');
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found ❌" });
    }

    // ✅ Set match state
    match.status = 'live';
    match.currentStatus = 'half-time';
    match.startedAt = new Date();
    match.startKickTime = startKickTime || new Date();
    match.totalDuration = totalDuration || 90;
    match.halfTimeDuration = halfTimeDuration || 15;

    // ✅ Assign extra time values (with default fallback)
    match.extraTimeAllowedForHalfTime = extraTimeAllowedForHalfTime ?? false;
    match.extraTimeDurationForHalfTime = extraTimeDurationForHalfTime ?? 0;
    match.extraTimeAllowedForFullTime = extraTimeAllowedForFullTime ?? false;
    match.extraTimeDurationForFullTime = extraTimeDurationForFullTime ?? 0;

    // ✅ Initialize scoreCard
    match.scoreCard = match.teams.map(({ teamId }) => {
      return {
        teamId: teamId._id,
        teamName: teamId.name,
        teamGoals: 0,
        players: teamId.players.map(player => ({
          playerId: player._id,
          playerName: player.name,
          goals: 0
        }))
      };
    });

    await match.save();

    return res.status(200).json({
      success: true,
      message: "Match started successfully ✅",
      match: {
        _id: match._id,
        name: match.name,
        status: match.status,
        currentStatus: match.currentStatus,
        startedAt: match.startedAt,
        startKickTime: match.startKickTime,
        totalDuration: match.totalDuration,
        halfTimeDuration: match.halfTimeDuration,

        // ✅ Return new fields as well
        extraTimeAllowedForHalfTime: match.extraTimeAllowedForHalfTime,
        extraTimeDurationForHalfTime: match.extraTimeDurationForHalfTime,
        extraTimeAllowedForFullTime: match.extraTimeAllowedForFullTime,
        extraTimeDurationForFullTime: match.extraTimeDurationForFullTime,

        scoreCard: match.scoreCard
      },
    });

  } catch (error) {
    console.error('Error starting match:', error);
    return res.status(500).json({ success: false, message: "Internal server error ❌" });
  }
};


export const updateFootballMatchStatus = async (req, res) => {
  try {
    const { userId, matchId } = req.params;
    const {
      status,
      kickOffTime,
      secondHalfKickOffTime,
      halfTimeScore,
      finalScore,
      extraTimeScore,
      penaltyScore,
      timeElapsed,
      goalUpdate,
    } = req.body;

    if (!userId || !matchId || !status) {
      return res.status(400).json({
        success: false,
        message: "User ID, Match ID, and status are required ❌",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found ❌",
      });
    }

    const match = await GameMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found ❌",
      });
    }

    if (String(match.createdBy) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this match ❌",
      });
    }

    match.status = status;

    switch (status) {
      case "live":
        if (kickOffTime) match.kickOffTime = kickOffTime;
        if (secondHalfKickOffTime) match.secondHalfKickOffTime = secondHalfKickOffTime;
        match.startedAt = new Date();
        break;
      case "postpone":
        match.postponedAt = new Date();
        break;
      case "cancel":
        match.cancelledAt = new Date();
        break;
      case "half-time":
        match.halfTimeScore = halfTimeScore || {};
        match.timeElapsed = timeElapsed || 45;
        break;
      case "extra-time":
        match.extraTimeScore = extraTimeScore || {};
        match.timeElapsed = timeElapsed || 105;
        break;
      case "penalties":
        match.penaltyScore = penaltyScore || {};
        break;
      case "finished":
        match.finalScore = finalScore || {};
        match.endedAt = new Date();
        match.timeElapsed = timeElapsed || 90;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid status value ❌",
        });
    }

    // Handle goal update if provided
    if (goalUpdate) {
      const { teamId, action } = goalUpdate;
      if (!teamId || !action || !["increment", "decrement"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid goalUpdate: teamId and action ('increment' or 'decrement') are required ❌",
        });
      }

      if (!match.teamScores) {
        match.teamScores = new Map();
      }

      const currentScore = match.teamScores.get(teamId) || 0;

      if (action === "increment") {
        match.teamScores.set(teamId, currentScore + 1);
      } else if (action === "decrement") {
        match.teamScores.set(teamId, Math.max(0, currentScore - 1));
      }

      // Emit live score update via Socket.IO
      const io = req.app.get('io');  // or however you access io instance
      io.emit('liveScoreUpdate', {
        matchId: match._id,
        teamScores: Object.fromEntries(match.teamScores), // convert Map to object for client
      });
    }

    await match.save();

    return res.status(200).json({
      success: true,
      message: `Match updated to '${status}' successfully ✅`,
      match,
    });

  } catch (error) {
    console.error("Error updating match status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error ❌",
    });
  }
};



export const getSingleGameMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check if matchId is provided
    if (!matchId) {
      return res.status(400).json({ success: false, message: 'Match ID is required' });
    }

    // Check if matchId is a valid ObjectId
    if (!mongoose.isValidObjectId(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID format' });
    }

    // Fetch the match with populates
    const match = await GameMatch.findById(matchId)
      .populate({
        path: "createdBy",
        select: "name email", // Only select name and email of creator
      })
      .populate({
        path: "categoryId",
        select: "name", // Only select category name
      })
      .populate({
        path: "teams.teamId",
        model: "GameTeam",
        populate: {
          path: "players",
          model: "User",
          select: "name email avatar", // Only select the player's name, email, and avatar
        },
      });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found ❌' });
    }

    // Building the response object
    const response = {
      _id: match._id,
      name: match.name,
      categoryId: match.categoryId,
      createdBy: match.createdBy,
      status: match.status,
      currentStatus: match.currentStatus,
      startKickTime: match.startKickTime,
      startedAt: match.startedAt,
      totalDuration: match.totalDuration,
      halfTimeDuration: match.halfTimeDuration,
      extraTimeAllowedForHalfTime: match.extraTimeAllowedForHalfTime,
      extraTimeDurationForHalfTime: match.extraTimeDurationForHalfTime,
      extraTimeAllowedForFullTime: match.extraTimeAllowedForFullTime,
      extraTimeDurationForFullTime: match.extraTimeDurationForFullTime,
      halfTimeScore: match.halfTimeScore,
      secondHalfScore: match.secondHalfScore,
      extraTimeScore: match.extraTimeScore,
      finalScore: match.finalScore,
      penaltyScore: match.penaltyScore || 'N/A', // Default to 'N/A' if not available
      teamScores: match.teamScores || [], // Default to empty array if not available
      winner: match.winner,
      cancelReason: match.cancelReason,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      scoreCard: match.scoreCard || [], // Default to empty array if not available
      teams: match.teams.map(team => ({
        teamId: team.teamId?._id,
        teamName: team.teamId?.teamName || 'Unknown Team', // Handle missing team name gracefully
        players: team.teamId?.players.map(p => ({
          playerId: p._id,
          playerName: p.name || 'Unknown Player', // Handle missing player name gracefully
          email: p.email,
          avatar: p.avatar || 'default-avatar.jpg', // Provide default avatar if not available
        })) || [], // If no players, provide an empty array
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Match fetched successfully ✅",
      match: response,
    });

  } catch (error) {
    console.error('Error fetching match:', error);
    return res.status(500).json({ success: false, message: 'Internal server error ❌' });
  }
};






export const getAllGameMatches = async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter object conditionally
    let filter = {};
    if (status) {
      filter.status = status;
    }

    // Find matches with optional status filter, populate creator and category for better info
    const matches = await GameMatch.find(filter)
      .populate('createdBy', 'name')      // populate creator's name
      .populate('categoryId', 'name')     // populate category name
      .sort({ createdAt: -1 })             // latest first
      .lean();

    res.status(200).json({
      success: true,
      count: matches.length,
      matches,
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




export const createGameMatchforFootball = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      scoringMethod,
      gameMode,
      players,
      teams,
      tournamentId,
      teamAId,
      teamBId,
      refereeName,
      stadium,
      kickOffTime,
      extraTimeAllowed = false,
      status = 'scheduled',
    } = req.body;

    const { userId } = req.params;

    const newMatch = new GameMatch({
      name,
      categoryId,
      scoringMethod,
      gameMode,
      players,
      teams,
      tournamentId,
      createdBy: userId,
      teamAId,
      teamBId,
      refereeName,
      stadium,
      kickOffTime,
      extraTimeAllowed,
      status,
    });

    await newMatch.save();

    return res.status(201).json({
      success: true,
      message: 'Game match created successfully',
      data: newMatch,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create game match',
      error: error.message,
    });
  }
};




export const getSingleGameMatches = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: "Match ID is required ❌"
      });
    }

    const match = await GameMatch.findById(matchId)
      .populate({
        path: 'teams.teamId',
        populate: { path: 'players', model: 'User' }
      })
      .populate({ path: 'winner', model: 'Team' });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found ❌"
      });
    }

    let scoreDetails = {};
    let liveGoalScores = [];

    // Only show scores if not upcoming
    if (match.status !== 'upcoming') {
      liveGoalScores = (match.scoreCard || []).map(teamScore => ({
        teamId: teamScore.teamId,
        teamName: teamScore.teamName,
        teamGoals: teamScore.teamGoals
      }));

      if (match.status === 'half-time') {
        scoreDetails = {
          halfTimeScore: match.halfTimeScore || {},
          timeElapsed: match.timeElapsed || 45
        };
      } else if (match.status === 'extra-time') {
        scoreDetails = {
          extraTimeScore: match.extraTimeScore || {},
          timeElapsed: match.timeElapsed || 105
        };
      } else if (match.status === 'finished') {
        scoreDetails = {
          finalScore: match.finalScore || {},
          timeElapsed: match.timeElapsed || 90
        };
      }
    }

    const matchData = {
      _id: match._id,
      name: match.name,
      status: match.status,
      currentStatus: match.currentStatus,                    // added
      startedAt: match.startedAt,
      startKickTime: match.startKickTime,
      totalDuration: match.totalDuration,
      halfTimeDuration: match.halfTimeDuration,
      extraTimeAllowed: match.extraTimeAllowed,
      extraTimeDuration: match.extraTimeDuration,
      extraTimeAllowedForHalfTime: match.extraTimeAllowedForHalfTime,   // added
      extraTimeDurationForHalfTime: match.extraTimeDurationForHalfTime, // added
      extraTimeAllowedForFullTime: match.extraTimeAllowedForFullTime,   // added
      extraTimeDurationForFullTime: match.extraTimeDurationForFullTime, // added
      scoreCard: match.status !== 'upcoming' ? match.scoreCard : [],
      liveGoalScores,
      winner: match.winner
        ? { teamId: match.winner._id, teamName: match.winner.name }
        : null,
      teams: match.teams.map(t => {
        const team = t.teamId;
        return {
          teamId: team._id,
          teamName: team.name,
          players: team.players.map(player => ({
            playerId: player._id,
            playerName: player.name
          }))
        };
      }),
      ...scoreDetails
    };

    const io = req.app.get("io");
    if (io) io.emit("match:update", matchData);

    res.status(200).json({
      success: true,
      message: "Match fetched successfully ✅",
      match: matchData
    });

  } catch (error) {
    console.error("Error fetching match:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error ❌"
    });
  }
};






export const updateMatchScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      teamId,
      playerId,
      goals,
      action,

      extraTimeAllowedForHalfTime,
      extraTimeDurationForHalfTime,
      extraTimeAllowedForFullTime,
      extraTimeDurationForFullTime,

      status,
      cancelReason,
      halfTimeScore,
      extraTimeScore,
      finalScore,
      timeElapsed,
      currentStatus,

      warningCards,
    } = req.body;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: "matchId is required in params ❌",
      });
    }

    const isGoalUpdate = teamId && playerId && typeof goals === 'number';
    const isExtraTimeUpdate =
      typeof extraTimeAllowedForHalfTime === 'boolean' ||
      typeof extraTimeDurationForHalfTime === 'number' ||
      typeof extraTimeAllowedForFullTime === 'boolean' ||
      typeof extraTimeDurationForFullTime === 'number';
    const isWarningCardUpdate =
      teamId && playerId && warningCards && typeof warningCards === 'object';

    const isOptionalUpdate =
      status || currentStatus || halfTimeScore || extraTimeScore || finalScore || timeElapsed !== undefined || cancelReason;

    if (!isGoalUpdate && !isExtraTimeUpdate && !isWarningCardUpdate && !isOptionalUpdate) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payload. Provide goal update, extra time update, warning card data, or a valid match status update ❌",
      });
    }

    const match = await GameMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found ❌" });
    }

    const oldCurrentStatus = match.currentStatus;

    if (currentStatus) {
      match.currentStatus = currentStatus;
    }

    if (oldCurrentStatus === 'half-time' && currentStatus === 'second-half') {
      match.secondHalfScore = { teamA: 0, teamB: 0 };
    }

    // Goal Update
    if (isGoalUpdate) {
      if (!match.scoreCard || !Array.isArray(match.scoreCard)) {
        return res.status(400).json({
          success: false,
          message: "ScoreCard is not initialized ❌",
        });
      }

      const teamScore = match.scoreCard.find(
        (team) => String(team.teamId) === String(teamId)
      );
      if (!teamScore) {
        return res.status(404).json({
          success: false,
          message: "Team not found in scorecard ❌",
        });
      }

      const playerScore = teamScore.players.find(
        (p) => String(p.playerId) === String(playerId)
      );
      if (!playerScore) {
        return res.status(404).json({
          success: false,
          message: "Player not found in team ❌",
        });
      }

      if (action === "dec") {
        teamScore.teamGoals = Math.max(0, teamScore.teamGoals - goals);
        playerScore.goals = Math.max(0, playerScore.goals - goals);
      } else {
        teamScore.teamGoals += goals;
        playerScore.goals += goals;
      }

      if (match.currentStatus === 'half-time') {
        match.halfTimeScore = {
          teamA: match.scoreCard[0].teamGoals,
          teamB: match.scoreCard[1].teamGoals,
        };
      }

      if (match.currentStatus === 'second-half') {
        if (!match.secondHalfScore) {
          match.secondHalfScore = { teamA: 0, teamB: 0 };
        }
        const teamIndex = match.scoreCard.findIndex(team => String(team.teamId) === String(teamId));
        const increment = action === "dec" ? -goals : goals;

        if (teamIndex === 0) {
          match.secondHalfScore.teamA = Math.max(0, (match.secondHalfScore.teamA || 0) + increment);
        } else if (teamIndex === 1) {
          match.secondHalfScore.teamB = Math.max(0, (match.secondHalfScore.teamB || 0) + increment);
        }
      }

      match.finalScore = {
        teamA: (match.halfTimeScore?.teamA || 0) + (match.secondHalfScore?.teamA || 0),
        teamB: (match.halfTimeScore?.teamB || 0) + (match.secondHalfScore?.teamB || 0),
      };
    }

    // Warning Card Update
    if (isWarningCardUpdate) {
      const teamScore = match.scoreCard.find(
        (team) => String(team.teamId) === String(teamId)
      );
      const playerScore = teamScore?.players.find(
        (p) => String(p.playerId) === String(playerId)
      );

      if (!teamScore || !playerScore) {
        return res.status(404).json({
          success: false,
          message: "Team or player not found in scorecard ❌",
        });
      }

      if (!playerScore.warningCards) {
        playerScore.warningCards = { yellow: 0, red: 0 };
      }

      playerScore.warningCards.yellow += warningCards.yellow || 0;
      playerScore.warningCards.red += warningCards.red || 0;

      if (
        playerScore.warningCards.red >= 1 ||
        playerScore.warningCards.yellow >= 2
      ) {
        playerScore.isOut = true;
      }
    }

    // Extra Time Handling
    if (typeof extraTimeAllowedForHalfTime === "boolean") {
      match.extraTimeAllowedForHalfTime = extraTimeAllowedForHalfTime;
    }
    if (typeof extraTimeDurationForHalfTime === "number") {
      match.extraTimeDurationForHalfTime = extraTimeDurationForHalfTime;
    }
    if (typeof extraTimeAllowedForFullTime === "boolean") {
      match.extraTimeAllowedForFullTime = extraTimeAllowedForFullTime;
    }
    if (typeof extraTimeDurationForFullTime === "number") {
      match.extraTimeDurationForFullTime = extraTimeDurationForFullTime;
    }

    // Optional Fields
    if (status) match.status = status;
    if (cancelReason) match.cancelReason = cancelReason;
    if (halfTimeScore) match.halfTimeScore = halfTimeScore;
    if (extraTimeScore) match.extraTimeScore = extraTimeScore;
    if (finalScore) match.finalScore = finalScore;
    if (timeElapsed !== undefined) match.timeElapsed = timeElapsed;

    // ✅ SAVE TO DB before emitting and response
    await match.save();

    // Prepare response
    const liveGoalScores = match.scoreCard
      ? match.scoreCard.map((team) => ({
          teamId: team.teamId,
          teamName: team.teamName,
          teamGoals: team.teamGoals,
        }))
      : [];

    const updatedMatchData = {
      _id: match._id,
      name: match.name,
      status: match.status,
      currentStatus: match.currentStatus || null,
      startedAt: match.startedAt,
      startKickTime: match.startKickTime,
      totalDuration: match.totalDuration,
      halfTimeDuration: match.halfTimeDuration,
      extraTimeAllowed: match.extraTimeAllowed,
      extraTimeDuration: match.extraTimeDuration,
      scoreCard: match.scoreCard,
      liveGoalScores,
      winner: match.winner || null,
      halfTimeScore: match.halfTimeScore || null,
      extraTimeScore: match.extraTimeScore || null,
      finalScore: match.finalScore || null,
      timeElapsed: match.timeElapsed || null,
      extraTimeAllowedForHalfTime: match.extraTimeAllowedForHalfTime,
      extraTimeDurationForHalfTime: match.extraTimeDurationForHalfTime,
      extraTimeAllowedForFullTime: match.extraTimeAllowedForFullTime,
      extraTimeDurationForFullTime: match.extraTimeDurationForFullTime,
      secondHalfScore: match.secondHalfScore || null,
      cancelReason: match.cancelReason || null,
    };

    io.emit("match:update", updatedMatchData);

    return res.status(200).json({
      success: true,
      message: "Match updated successfully ✅",
      match: updatedMatchData,
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error ❌",
    });
  }
};



export const getCompletedMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Match ID is required" });
    }

    const match = await Match.findById(id)
      .populate("categoryId", "name")
      .populate("tournamentId", "name")
      .populate("team1", "teamName players")
      .populate("team2", "teamName players")
      .populate("currentStriker", "name")
      .populate("nonStriker", "name")
      .populate("currentBowler", "name")
      .populate("opening.striker", "name")
      .populate("opening.nonStriker", "name")
      .populate("bowling.bowler", "name");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // ✅ PLAYER NAME MAPPING
    const playerNameMap = new Map();

    // Team1 players
    if (match.team1 && match.team1.players) {
      match.team1.players.forEach(player => {
        if (player._id) {
          playerNameMap.set(player._id.toString(), player.name);
        }
      });
    }

    // Team2 players
    if (match.team2 && match.team2.players) {
      match.team2.players.forEach(player => {
        if (player._id) {
          playerNameMap.set(player._id.toString(), player.name);
        }
      });
    }

    // Additional players
    const additionalPlayers = [
      match.currentStriker,
      match.nonStriker,
      match.currentBowler,
      match.opening?.striker,
      match.opening?.nonStriker,
      match.bowling?.bowler
    ];

    additionalPlayers.forEach(player => {
      if (player && player._id) {
        playerNameMap.set(player._id.toString(), player.name);
      }
    });

    // ✅ SIMPLIFIED: Calculate batting stats ONLY from overHistory
    const calculateBattingStats = (playerId, inningsNumber) => {
      if (!playerId) return null;

      const playerIdStr = playerId.toString();
      
      // ✅ USE ONLY OVERHISTORY (completed overs)
      let runs = 0;
      let balls = 0;
      let fours = 0;
      let sixes = 0;
      let isOut = false;
      let dismissal = '';

      if (match.scores && match.scores.length > 0) {
        match.scores.forEach(score => {
          const scoreInnings = score.innings || 1;
          if (scoreInnings !== inningsNumber) return;
          
          if (score.overHistory) {
            score.overHistory.forEach(over => {
              if (over.balls) {
                over.balls.forEach(ball => {
                  const ballStrikerId = ball.striker?.toString();
                  if (ballStrikerId === playerIdStr) {
                    const ballRuns = ball.runs || 0;
                    runs += ballRuns;
                    
                    if (!ball.extraType || (ball.extraType !== 'wide' && ball.extraType !== 'noball')) {
                      balls += 1;
                    }
                    
                    if (ballRuns === 4) fours += 1;
                    if (ballRuns === 6) sixes += 1;
                    
                    if (ball.wicket && ball.striker?.toString() === playerIdStr) {
                      isOut = true;
                      dismissal = ball.dismissalType || '';
                    }
                  }
                });
              }
            });
          }
        });
      }

      const strikeRate = balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0;

      return {
        runs,
        balls,
        fours,
        sixes,
        strikeRate,
        isOut,
        dismissals: dismissal
      };
    };

    // ✅ SIMPLIFIED: Calculate bowling stats ONLY from overHistory
    const calculateBowlingStats = (playerId, inningsNumber) => {
      if (!playerId) return null;

      const playerIdStr = playerId.toString();
      
      let overs = 0;
      let runsConceded = 0;
      let wickets = 0;
      let maidens = 0;
      let wides = 0;
      let noBalls = 0;

      if (match.scores && match.scores.length > 0) {
        match.scores.forEach(score => {
          const scoreInnings = score.innings || 1;
          if (scoreInnings !== inningsNumber) return;
          
          if (score.overHistory) {
            score.overHistory.forEach(over => {
              if (over.balls && over.balls.length > 0) {
                const firstBallBowler = over.balls[0]?.bowler?.toString();
                if (firstBallBowler === playerIdStr) {
                  overs += 1;
                  
                  let overRuns = 0;
                  let overWickets = 0;
                  let overWides = 0;
                  let overNoBalls = 0;
                  let isMaiden = true;
                  
                  over.balls.forEach(ball => {
                    if (ball.bowler?.toString() === playerIdStr) {
                      overRuns += ball.runs || 0;
                      
                      if (ball.extraType === 'wide' || ball.extraType === 'noball') {
                        overRuns += 1;
                      }
                      
                      if (ball.wicket) overWickets += 1;
                      if (ball.extraType === 'wide') overWides += 1;
                      if (ball.extraType === 'noball') overNoBalls += 1;
                      
                      if ((ball.runs || 0) > 0 && ball.extraType !== 'wide' && ball.extraType !== 'noball') {
                        isMaiden = false;
                      }
                    }
                  });
                  
                  runsConceded += overRuns;
                  wickets += overWickets;
                  wides += overWides;
                  noBalls += overNoBalls;
                  if (isMaiden) maidens += 1;
                }
              }
            });
          }
        });
      }

      const economy = overs > 0 ? parseFloat((runsConceded / overs).toFixed(2)) : 0;

      return {
        overs: parseFloat(overs.toFixed(1)),
        runsConceded,
        wickets,
        maidens,
        economy,
        wides,
        noBalls
      };
    };

    // ✅ ADD STATUS TO TEAM PLAYERS
    const addStatusToTeamPlayers = (team) => {
      if (!team || !team.players) return team;

      return {
        _id: team._id,
        teamName: team.teamName,
        players: team.players.map(player => {
          const playerIdStr = player._id.toString();
          
          const playerStatusData = match.playerStatuses?.find(ps => 
            ps.playerId.toString() === playerIdStr
          );
          
          return {
            name: player.name,
            _id: player._id,
            status: playerStatusData?.playerStatus || 'Not Playing'
          };
        })
      };
    };

    // ✅ TEAM STATUS DETERMINATION
    const determineTeamStatus = () => {
      const currentInnings = match.currentInnings || 1;
      let battingTeam = null;
      let bowlingTeam = null;

      if (currentInnings === 1) {
        battingTeam = match.team1;
        bowlingTeam = match.team2;
      } else if (currentInnings === 2) {
        battingTeam = match.team2;
        bowlingTeam = match.team1;
      }

      return {
        battingTeam,
        bowlingTeam,
        currentInnings,
        totalInnings: match.totalInnings || 2,
        matchStatus: match.status || 'live'
      };
    };

    const teamStatus = determineTeamStatus();

    // ✅ CREATE TEAMS WITH STATUS
    const team1WithStatus = addStatusToTeamPlayers(match.team1);
    const team2WithStatus = addStatusToTeamPlayers(match.team2);

    // ✅ SIMPLIFIED SCORECARD GENERATION
    const generateScorecard = () => {
      const inningsData = [];
      const totalInnings = 2;

      for (let inningsNumber = 1; inningsNumber <= totalInnings; inningsNumber++) {
        
        let score = match.scores?.find(s => s.innings === inningsNumber);
        
        if (!score) {
          score = {
            innings: inningsNumber,
            runs: 0,
            wickets: 0,
            overs: 0,
            runRate: 0,
            extras: {
              wides: 0,
              noBalls: 0,
              byes: 0,
              legByes: 0,
              penalties: 0,
              total: 0
            },
            overHistory: [],
            currentOver: {},
            fallOfWickets: []
          };
        }

        // ✅ TEAMS DETERMINATION
        let battingTeam, bowlingTeam;
        if (inningsNumber === 1) {
          battingTeam = {
            id: team1WithStatus._id,
            name: team1WithStatus.teamName
          };
          bowlingTeam = {
            id: team2WithStatus._id,
            name: team2WithStatus.teamName
          };
        } else {
          battingTeam = {
            id: team2WithStatus._id,
            name: team2WithStatus.teamName
          };
          bowlingTeam = {
            id: team1WithStatus._id,
            name: team1WithStatus.teamName
          };
        }

        // ✅ BATTING DATA
        const battingData = [];
        const battingTeamPlayers = inningsNumber === 1 ? team1WithStatus.players : team2WithStatus.players;
        
        battingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          const playerStats = calculateBattingStats(teamPlayer._id, inningsNumber);
          
          const playerStatusData = match.playerStatuses?.find(ps => 
            ps.playerId.toString() === playerIdStr
          );
          
          let status = playerStatusData?.playerStatus || 'Not Played Yet';
          let isNotOut = true;
          let dismissal = '';
          
          if (playerStats && (playerStats.runs > 0 || playerStats.balls > 0)) {
            isNotOut = !playerStats.isOut;
            dismissal = playerStats.dismissals || '';
            
            if (inningsNumber === match.currentInnings) {
              status = isNotOut ? 'Batting' : 'Out';
            } else {
              status = isNotOut ? 'Not Out' : 'Out';
            }
          }

          battingData.push({
            playerId: teamPlayer._id,
            playerName: playerName,
            runs: playerStats?.runs || 0,
            balls: playerStats?.balls || 0,
            fours: playerStats?.fours || 0,
            sixes: playerStats?.sixes || 0,
            strikeRate: playerStats?.strikeRate || 0,
            dismissal: dismissal,
            isNotOut: isNotOut,
            status: status
          });
        });

        // ✅ BOWLING DATA
        const bowlingData = [];
        const bowlingTeamPlayers = inningsNumber === 1 ? team2WithStatus.players : team1WithStatus.players;
        
        bowlingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          const playerStats = calculateBowlingStats(teamPlayer._id, inningsNumber);
          
          const playerStatusData = match.playerStatuses?.find(ps => 
            ps.playerId.toString() === playerIdStr
          );
          
          let status = playerStatusData?.playerStatus || 'Not Played Yet';

          if (playerStats && (playerStats.overs > 0 || playerStats.wickets > 0 || playerStats.runsConceded > 0)) {
            status = 'Bowled';
          }

          bowlingData.push({
            playerId: teamPlayer._id,
            playerName: playerName,
            overs: playerStats?.overs || 0,
            maidens: playerStats?.maidens || 0,
            runs: playerStats?.runsConceded || 0,
            wickets: playerStats?.wickets || 0,
            economy: playerStats?.economy || 0,
            wides: playerStats?.wides || 0,
            noBalls: playerStats?.noBalls || 0,
            status: status
          });
        });

        // ✅ EXTRAS DATA
        const calculateExtrasFromOverHistory = () => {
          let wides = 0;
          let noBalls = 0;
          let byes = 0;
          let legByes = 0;
          let penalties = 0;

          if (score.overHistory) {
            score.overHistory.forEach(over => {
              if (over.balls) {
                over.balls.forEach(ball => {
                  if (ball.extraType === 'wide') wides += 1;
                  else if (ball.extraType === 'noball') noBalls += 1;
                  else if (ball.extraType === 'bye') byes += (ball.runs || 0);
                  else if (ball.extraType === 'legbye') legByes += (ball.runs || 0);
                });
              }
            });
          }

          const total = wides + noBalls + byes + legByes + penalties;

          return {
            wides,
            noBalls,
            byes,
            legByes,
            penalties,
            total
          };
        };

        const extras = calculateExtrasFromOverHistory();

        inningsData.push({
          inningsNumber: inningsNumber,
          battingTeam: battingTeam,
          bowlingTeam: bowlingTeam,
          totalRuns: score.runs || 0,
          totalWickets: score.wickets || 0,
          totalOvers: score.overs || 0,
          runRate: score.runRate || 0,
          extras: extras,
          batting: battingData,
          bowling: bowlingData
        });
      }

      // Match summary
      const matchSummary = {
        toss: {
          winner: match.toss?.winner || null,
          elected: match.decision || 'bat',
          winnerName: match.toss?.winner ? 
            (match.toss.winner.toString() === team1WithStatus._id.toString() ? 
              team1WithStatus.teamName : team2WithStatus.teamName) : null
        },
        result: match.status === 'completed' ? 'Match Completed' : 
                match.status === 'upcoming' ? 'Match Not Started' : 'Match in Progress',
        currentInnings: match.currentInnings || 1,
        venue: match.venue,
        date: match.date,
        matchType: match.matchType
      };

      return {
        innings: inningsData,
        matchSummary: matchSummary
      };
    };

    const scorecard = generateScorecard();

    // ✅ FINAL SIMPLIFIED RESPONSE
    return res.status(200).json({
      success: true,
      match: {
        _id: match._id,
        team1: team1WithStatus,
        team2: team2WithStatus,
        scorecard: scorecard,
        matchStatus: match.status,
        currentInnings: match.currentInnings || 1,
        venue: match.venue,
        date: match.date,
        matchType: match.matchType
      }
    });

  } catch (error) {
    console.error("Error fetching single match:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// Start Badminton Match Controller
export const startBadmintonMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      startTime,
      totalSets,
      pointsPerSet,
      winBy,
      allowDeuce,
      maxDeucePoint,
      currentSet
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ success: false, message: "Invalid match ID ❌" });
    }

    const match = await GameMatch.findById(matchId).populate('teams.teamId');
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found ❌" });
    }

    match.status = 'live';
    match.currentStatus = 'in-progress'; // or any relevant status for badminton
    match.startedAt = new Date();
    match.startTime = startTime || new Date();
    match.totalSets = totalSets || 3;
    match.pointsPerSet = pointsPerSet || 21;
    match.winBy = winBy || 2;
    match.allowDeuce = allowDeuce ?? true;
    match.maxDeucePoint = maxDeucePoint || 30;
    match.currentSet = currentSet || 1;

    // Initialize scoreCard for badminton
    match.scoreCard = match.teams.map(({ teamId }) => ({
      teamId: teamId._id,
      teamName: teamId.name,
      teamGoals: 0, // or teamPoints if you want to rename
      players: teamId.players.map(player => ({
        playerId: player._id,
        playerName: player.name,
        points: 0,
        warningCards: {
          yellow: 0,
          red: 0,
        },
        isOut: false,
      }))
    }));

    await match.save();

    return res.status(200).json({
      success: true,
      message: "Badminton match started successfully ✅",
      match: {
        _id: match._id,
        name: match.name,
        status: match.status,
        currentStatus: match.currentStatus,
        startedAt: match.startedAt,
        startTime: match.startTime,
        totalSets: match.totalSets,
        pointsPerSet: match.pointsPerSet,
        winBy: match.winBy,
        allowDeuce: match.allowDeuce,
        maxDeucePoint: match.maxDeucePoint,
        currentSet: match.currentSet,
        scoreCard: match.scoreCard,
      }
    });

  } catch (error) {
    console.error('Error starting badminton match:', error);
    return res.status(500).json({ success: false, message: "Internal server error ❌" });
  }
};



export const getSingleBadmintonById = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({ success: false, message: "Match ID is required" });
    }

    if (!mongoose.isValidObjectId(matchId)) {
      return res.status(400).json({ success: false, message: "Invalid match ID format" });
    }

    const match = await GameMatch.findById(matchId)
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "categoryId",
        select: "name",
      })
      .populate({
        path: "teams.teamId",
        model: "GameTeam",
        populate: {
          path: "players",
          model: "User",
          select: "name email avatar",
        },
      });

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found ❌" });
    }

    const scoreCard = match.scoreCard || [];
    const isTeamMatch = match.teams && match.teams.length > 0;

    let teams = [];
    let detailedScoreCard = [];

    if (isTeamMatch) {
      // ✅ TEAM-BASED LOGIC
      teams = match.teams.map((team) => {
        const scoreEntry = scoreCard.find(
          (sc) => sc.teamId?.toString() === team.teamId?._id?.toString()
        );

        return {
          teamId: team.teamId?._id,
          teamName: team.teamId?.teamName || "Unknown Team",
          teamPoints: scoreEntry?.teamGoals ?? scoreEntry?.teamPoints ?? 0,
          players:
            team.teamId?.players.map((p) => {
              const playerScore = scoreEntry?.players.find(
                (pl) => pl.playerId?.toString() === p._id?.toString()
              );
              return {
                playerId: p._id,
                playerName: p.name || "Unknown Player",
                avatar: p.avatar || "default-avatar.jpg",
                points: playerScore?.points ?? 0,
              };
            }) || [],
        };
      });

      // ✅ DETAILED SCORE CARD FOR TEAMS
      detailedScoreCard = match.teams.map((team) => {
        const scoreEntry = scoreCard.find(
          (sc) => sc.teamId?.toString() === team.teamId?._id?.toString()
        );

        return {
          teamId: team.teamId?._id,
          teamName: team.teamId?.teamName || "Unknown Team",
          teamPoints: scoreEntry?.teamGoals ?? scoreEntry?.teamPoints ?? 0,
          players: (scoreEntry?.players || []).map(playerScore => {
            const playerInfo = team.teamId?.players.find(
              p => p._id.toString() === playerScore.playerId?.toString()
            );
            return {
              playerId: playerScore.playerId,
              playerName: playerInfo?.name || "Unknown Player",
              points: playerScore.points || 0,
              goals: playerScore.goals || 0,
              warningCards: playerScore.warningCards || { yellow: 0, red: 0 },
              isOut: playerScore.isOut || false
            };
          })
        };
      });

    } else {
      // ✅ PLAYER-BASED MATCH LOGIC
      const players = await User.find({
        name: { $in: match.players },
      }).select("_id name avatar email");

      teams = players.map((player) => {
        const playerScoreEntry = scoreCard?.[0]?.players?.find(
          (p) => p.playerId?.toString() === player._id.toString()
        );

        return {
          playerId: player._id,
          playerName: player.name,
          avatar: player.avatar || "default-avatar.jpg",
          email: player.email,
          points: playerScoreEntry?.points ?? 0,
        };
      });

      // ✅ DETAILED SCORE CARD FOR PLAYERS
      detailedScoreCard = [{
        teamId: null,
        teamPoints: 0,
        players: players.map(player => {
          const playerScoreEntry = scoreCard?.[0]?.players?.find(
            (p) => p.playerId?.toString() === player._id.toString()
          );
          return {
            playerId: player._id,
            playerName: player.name,
            points: playerScoreEntry?.points ?? 0,
            goals: playerScoreEntry?.goals ?? 0,
            warningCards: playerScoreEntry?.warningCards || { yellow: 0, red: 0 },
            isOut: playerScoreEntry?.isOut || false
          };
        })
      }];
    }

    // 🔧 Build sets array using teams data
    const totalSets = match.totalSets || 3;
    const existingSets = match.sets || [];

    const sets = Array.from({ length: totalSets }, (_, i) => {
      const setIndex = i + 1;
      const existingSet = existingSets.find((s) => s.setNumber === setIndex);

      if (isTeamMatch && teams.length >= 2) {
        const teamA = teams[0];
        const teamB = teams[1];

        if (existingSet) {
          return {
            ...existingSet.toObject(),
            score: {
              teamA: {
                name: teamA.teamName,
                score: existingSet.score.teamA || 0,
                teamId: teamA.teamId
              },
              teamB: {
                name: teamB.teamName,
                score: existingSet.score.teamB || 0,
                teamId: teamB.teamId
              }
            },
            winner: existingSet.winner === "teamA" ? teamA.teamName : 
                    existingSet.winner === "teamB" ? teamB.teamName : null,
            winnerId: existingSet.winner === "teamA" ? teamA.teamId : 
                      existingSet.winner === "teamB" ? teamB.teamId : null
          };
        } else {
          return {
            setNumber: setIndex,
            score: {
              teamA: {
                name: teamA.teamName,
                score: 0,
                teamId: teamA.teamId
              },
              teamB: {
                name: teamB.teamName,
                score: 0,
                teamId: teamB.teamId
              }
            },
            winner: null,
            winnerId: null
          };
        }
      } else {
        // Player-based match (existing code)
        return existingSet || {
          setNumber: setIndex,
          score: { playerA: 0, playerB: 0 },
          winner: null,
        };
      }
    });

    // 🔧 FinalScore using teams data
    let finalScore = match.finalScore;
    if (isTeamMatch && teams.length >= 2) {
      const teamA = teams[0];
      const teamB = teams[1];
      
      if (match.finalScore) {
        finalScore = {
          teamA: {
            name: teamA.teamName,
            score: match.finalScore.teamA || 0,
            teamId: teamA.teamId
          },
          teamB: {
            name: teamB.teamName,
            score: match.finalScore.teamB || 0,
            teamId: teamB.teamId
          }
        };
      } else {
        finalScore = {
          teamA: {
            name: teamA.teamName,
            score: 0,
            teamId: teamA.teamId
          },
          teamB: {
            name: teamB.teamName,
            score: 0,
            teamId: teamB.teamId
          }
        };
      }
    } else if (!isTeamMatch) {
      // Player-based final score
      finalScore = match.finalScore || { playerA: 0, playerB: 0 };
    }

    // 🔧 Winner field ko bhi update karein agar match finished hai
    let matchWinner = match.winner;
    if (isTeamMatch && match.status === "finished" && matchWinner && teams.length >= 2) {
      const winningTeam = teams.find(team => 
        team.teamId.toString() === matchWinner.toString()
      );
      if (winningTeam) {
        matchWinner = {
          teamId: winningTeam.teamId,
          teamName: winningTeam.teamName,
          players: winningTeam.players
        };
      }
    }

    // 🔧 Scoring Template (agar nahi hai toh default values)
    const scoringTemplate = match.scoringTemplate || {
      setsToWin: match.totalSets ? Math.ceil(match.totalSets / 2) : 2,
      pointsToWinSet: match.pointsPerSet || 21,
      winBy: match.winBy || 2,
      maxPoints: match.maxDeucePoint || 30,
      hasGames: false
    };

    const response = {
      _id: match._id,
      name: match.name,
      categoryId: match.categoryId,
      createdBy: match.createdBy,
      status: match.status,
      currentStatus: match.currentStatus,
      startTime: match.startTime,
      totalSets: match.totalSets,
      pointsPerSet: match.pointsPerSet,
      winBy: match.winBy,
      allowDeuce: match.allowDeuce,
      maxDeucePoint: match.maxDeucePoint,
      currentSet: match.currentSet,
      sets,
      finalScore,
      winner: matchWinner,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      teams,
      isTeamMatch,
      scoreCard: detailedScoreCard,
      scoringTemplate: scoringTemplate
    };

    // 🟢 Emit fetched data
    const io = req.app.get("io");
    io.emit("badminton:match:fetched", {
      matchId: match._id,
      message: "Match data fetched",
      match: response,
    });

    return res.status(200).json({
      success: true,
      message: "Badminton match fetched successfully ✅",
      match: response,
    });
  } catch (error) {
    console.error("Error fetching badminton match:", error);
    return res.status(500).json({ success: false, message: "Internal server error ❌" });
  }
};

export const getCompletedGameMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({ success: false, message: 'Match ID is required' });
    }

    if (!mongoose.isValidObjectId(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid match ID format' });
    }

    const match = await GameMatch.findById(matchId)
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "categoryId",
        select: "name",
      })
      .populate({
        path: "teams.teamId",
        model: "GameTeam",
        populate: {
          path: "players",
          model: "User",
          select: "name email avatar",
        },
      });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found ❌' });
    }

    if (match.status !== 'finished') {
      return res.status(403).json({ 
        success: false, 
        message: 'Match data is only available for completed matches ❌' 
      });
    }

    const finalScore = match.finalScore || { teamA: 0, teamB: 0 };
    let winner = null;

    if (finalScore.teamA > finalScore.teamB) {
      winner = {
        teamName: match.teams[0]?.teamId?.teamName || "Team A",
        goals: finalScore.teamA,
      };
    } else if (finalScore.teamB > finalScore.teamA) {
      winner = {
        teamName: match.teams[1]?.teamId?.teamName || "Team B",
        goals: finalScore.teamB,
      };
    }

    const response = {
      _id: match._id,
      name: match.name,
      categoryId: match.categoryId,
      createdBy: match.createdBy,
      status: match.status,
      currentStatus: match.currentStatus,
      startKickTime: match.startKickTime,
      startedAt: match.startedAt,
      totalDuration: match.totalDuration,
      halfTimeDuration: match.halfTimeDuration,
      extraTimeAllowedForHalfTime: match.extraTimeAllowedForHalfTime,
      extraTimeDurationForHalfTime: match.extraTimeDurationForHalfTime,
      extraTimeAllowedForFullTime: match.extraTimeAllowedForFullTime,
      extraTimeDurationForFullTime: match.extraTimeDurationForFullTime,
      halfTimeScore: match.halfTimeScore,
      secondHalfScore: match.secondHalfScore,
      extraTimeScore: match.extraTimeScore,
      finalScore,
      penaltyScore: match.penaltyScore || 'N/A',
      teamScores: match.teamScores || [],
      winner,  // <--- winner object with teamName and goals here
      cancelReason: match.cancelReason,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      scoreCard: match.scoreCard || [],
      teams: match.teams.map(team => ({
        teamId: team.teamId?._id,
        teamName: team.teamId?.teamName || 'Unknown Team',
        players: team.teamId?.players.map(p => ({
          playerId: p._id,
          playerName: p.name || 'Unknown Player',
          email: p.email,
          avatar: p.avatar || 'default-avatar.jpg',
        })) || [],
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Completed match fetched successfully ✅",
      match: response,
    });

  } catch (error) {
    console.error('Error fetching completed match:', error);
    return res.status(500).json({ success: false, message: 'Internal server error ❌' });
  }
};



export const updateBadmintonMatchFlexible = async (req, res) => {
  try {
    const { matchId } = req.params;
    const updateData = req.body;

    if (!matchId || !mongoose.isValidObjectId(matchId)) {
      return res.status(400).json({ success: false, message: "Invalid match ID" });
    }

    const match = await GameMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found ❌" });
    }

    const isTeamMatch = match.teams && match.teams.length > 0;

    // === 1. Update General Match Fields ===
    const updatableFields = [
      "status",
      "currentStatus",
      "currentSet",
      "startTime",
      "totalSets",
      "pointsPerSet",
      "winBy",
      "allowDeuce",
      "maxDeucePoint",
      "finalScore",
      "winner"
    ];

    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        match[field] = updateData[field];
      }
    });

    // === 1.1 Auto-set winner of previous set ===
    if (updateData.currentSet && Number.isInteger(updateData.currentSet)) {
      const newSet = updateData.currentSet;
      const prevSetIndex = newSet - 2;

      if (prevSetIndex >= 0 && match.sets && match.sets[prevSetIndex]) {
        const prevSet = match.sets[prevSetIndex];
        const score = prevSet.score || {};

        if (isTeamMatch) {
          const teamAScore = score.teamA || 0;
          const teamBScore = score.teamB || 0;

          prevSet.winner = teamAScore > teamBScore ? "teamA" : teamBScore > teamAScore ? "teamB" : null;
        } else {
          const playerAScore = score.playerA || 0;
          const playerBScore = score.playerB || 0;

          prevSet.winner = playerAScore > playerBScore ? "playerA" : playerBScore > playerAScore ? "playerB" : null;
        }
      }

      // === 1.2 Handle Current Set Winner ===
      const currentSetIndex = (newSet || 1) - 1;
      if (match.sets[currentSetIndex]) {
        const currentSet = match.sets[currentSetIndex];
        const currentScore = currentSet.score || {};

        if (isTeamMatch) {
          const teamAScore = currentScore.teamA || 0;
          const teamBScore = currentScore.teamB || 0;

          // If winner is not set yet, set it based on the current score
          if (currentSet.winner === null) {
            currentSet.winner = teamAScore > teamBScore ? "teamA" : teamBScore > teamAScore ? "teamB" : null;
          }
        } else {
          const playerAScore = currentScore.playerA || 0;
          const playerBScore = currentScore.playerB || 0;

          if (currentSet.winner === null) {
            currentSet.winner = playerAScore > playerBScore ? "playerA" : playerBScore > playerAScore ? "playerB" : null;
          }
        }
      }
    }

    // === 2. Update Player or Team Points ===
    if (updateData.points !== undefined && updateData.action) {
      const { points, action } = updateData;
      const pointChange = action === "inc" ? points : -points;
      match.scoreCard = match.scoreCard || [];

      if (isTeamMatch) {
        const { teamId, playerId } = updateData;
        if (!teamId || !playerId) {
          return res.status(400).json({ success: false, message: "Team ID and Player ID are required" });
        }

        // TEAM-based match logic
        let teamScore = match.scoreCard.find(sc => sc.teamId.toString() === teamId);
        if (!teamScore) {
          teamScore = { teamId, teamGoals: 0, players: [] };
          match.scoreCard.push(teamScore);
        }

        teamScore.teamGoals += pointChange;
        if (teamScore.teamGoals < 0) teamScore.teamGoals = 0;

        let playerScore = teamScore.players.find(p => p.playerId.toString() === playerId);
        if (!playerScore) {
          playerScore = {
            playerId,
            goals: 0,
            points: 0,
            warningCards: { yellow: 0, red: 0 },
            isOut: false
          };
          teamScore.players.push(playerScore);
        }

        playerScore.points += pointChange;
        if (playerScore.points < 0) playerScore.points = 0;

        // === 3. Update Current Set Score (TEAM-based) ===
        const currentSetIndex = (match.currentSet || 1) - 1;
        match.sets = match.sets || [];
        while (match.sets.length <= currentSetIndex) {
          match.sets.push({ setNumber: match.sets.length + 1, score: { teamA: 0, teamB: 0 }, winner: null });
        }

        const teamIndex = match.teams.findIndex(t => t.teamId.toString() === teamId);
        if (teamIndex === 0) {
          match.sets[currentSetIndex].score.teamA += pointChange;
          if (match.sets[currentSetIndex].score.teamA < 0) match.sets[currentSetIndex].score.teamA = 0;
        } else if (teamIndex === 1) {
          match.sets[currentSetIndex].score.teamB += pointChange;
          if (match.sets[currentSetIndex].score.teamB < 0) match.sets[currentSetIndex].score.teamB = 0;
        }

      } else {
        // PLAYER-based match logic
        const { playerId } = updateData;
        if (!playerId) {
          return res.status(400).json({ success: false, message: "Player ID is required" });
        }

        let playerScore = match.scoreCard?.[0]?.players?.find(p => p.playerId.toString() === playerId);

        if (!match.scoreCard[0]) {
          match.scoreCard[0] = { teamId: null, players: [] };
        }

        if (!playerScore) {
          playerScore = {
            playerId,
            goals: 0,
            points: 0,
            warningCards: { yellow: 0, red: 0 },
            isOut: false
          };
          match.scoreCard[0].players.push(playerScore);
        }

        playerScore.points += pointChange;
        if (playerScore.points < 0) playerScore.points = 0;

        // === 3. Update Current Set Score (PLAYER-based) ===
        const currentSetIndex = (match.currentSet || 1) - 1;
        match.sets = match.sets || [];
        while (match.sets.length <= currentSetIndex) {
          match.sets.push({
            setNumber: match.sets.length + 1,
            score: { playerA: 0, playerB: 0 },
            winner: null
          });
        }

        const playerIndex = match.players.findIndex(p => p.toString() === playerId.toString());

        if (playerIndex === 0) {
          match.sets[currentSetIndex].score.playerA += pointChange;
          if (match.sets[currentSetIndex].score.playerA < 0) match.sets[currentSetIndex].score.playerA = 0;
        } else if (playerIndex === 1) {
          match.sets[currentSetIndex].score.playerB += pointChange;
          if (match.sets[currentSetIndex].score.playerB < 0) match.sets[currentSetIndex].score.playerB = 0;
        }
      }
    }

    // === 4. If match is being finished and it’s the last set, calculate finalScore and winner ===
    if (match.status === "finished" && match.currentSet === match.totalSets && Array.isArray(match.sets)) {
      let scoreA = 0;
      let scoreB = 0;

      match.sets.forEach(set => {
        if (isTeamMatch) {
          if (set.winner === "teamA") scoreA += 1;
          else if (set.winner === "teamB") scoreB += 1;
        } else {
          if (set.winner === "playerA") scoreA += 1;
          else if (set.winner === "playerB") scoreB += 1;
        }
      });

      // Final scores
      match.finalScore = {
        teamA: scoreA,
        teamB: scoreB
      };

      // Determine winner based on the final score
      if (scoreA > scoreB) {
        match.winner = isTeamMatch ? match.teams[0]?.teamId : match.players[0];
      } else if (scoreB > scoreA) {
        match.winner = isTeamMatch ? match.teams[1]?.teamId : match.players[1];
      } else {
        match.winner = null; // If it's a draw
      }
    }

    // === 5. Save Match ===
    await match.save();

    // === 6. Populate & Emit ===
    const updatedMatch = await GameMatch.findById(matchId)
      .populate("createdBy", "name email")
      .populate("categoryId", "name")
      .populate({
        path: "teams.teamId",
        model: "GameTeam",
        populate: {
          path: "players",
          model: "User",
          select: "name email avatar",
        },
      })
      .populate("winner", "teamName");

    const io = req.app.get("io");
    io.emit("badminton:match:updated", updatedMatch);

    return res.status(200).json({
      success: true,
      message: "Badminton match updated successfully ✅",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Error updating badminton match:", error);
    return res.status(500).json({ success: false, message: "Internal server error ❌" });
  }
};
