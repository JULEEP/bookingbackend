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
    const { search } = req.query;

    let query = {};

    if (search && search.trim() !== "") {
      query.teamName = { $regex: new RegExp(search, "i") };
    }

    const teams = await Team.find(query);

    return res.status(200).json({
      success: true,
      total: teams.length,
      message: "Teams fetched successfully",
      teams, // ✅ players' status will be included from DB
    });

  } catch (error) {
    console.error("Error fetching teams:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
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

    // ✅ CREATE: Player ID to name mapping
    const playerNameMap = new Map();

    // Team1 ke saare players ke names add karo
    if (match.team1 && match.team1.players) {
      match.team1.players.forEach(player => {
        if (player._id) {
          playerNameMap.set(player._id.toString(), player.name);
        }
      });
    }

    // Team2 ke saare players ke names add karo
    if (match.team2 && match.team2.players) {
      match.team2.players.forEach(player => {
        if (player._id) {
          playerNameMap.set(player._id.toString(), player.name);
        }
      });
    }

    // All populated players se names collect karein
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

    // ✅ FIXED FUNCTION: Get player data from playersHistory - IMPROVED
    const getPlayerDataFromHistory = (playerId, inningsNumber) => {
      if (!playerId || !match.playersHistory) return null;
      
      const playerIdStr = playerId.toString();
      
      // Find the specific innings
      const inningsData = match.playersHistory.find(inn => inn.innings === inningsNumber);
      if (!inningsData || !inningsData.players) return null;
      
      // Find player in this innings - DEEPER COMPARISON
      const playerData = inningsData.players.find(p => {
        if (!p.playerId) return false;
        
        // Handle both ObjectId and string comparisons
        const historyPlayerId = p.playerId.toString ? p.playerId.toString() : String(p.playerId);
        return historyPlayerId === playerIdStr;
      });
      
      return playerData || null;
    };

    // ✅ IMPROVED FUNCTION: Calculate batting stats from ALL over data
    const calculateBattingStatsFromAllOvers = (playerId, inningsNumber) => {
      if (!playerId || !match.scores || match.scores.length === 0) return null;
      
      const playerIdStr = playerId.toString();
      let runs = 0;
      let balls = 0;
      let fours = 0;
      let sixes = 0;
      
      // Har score (innings) check karo
      match.scores.forEach(score => {
        // Sirf current innings ke data ko consider karo
        if ((score.innings || 1) !== inningsNumber) return;
        
        // Current over se data
        if (score.currentOver && score.currentOver.balls) {
          score.currentOver.balls.forEach(ball => {
            if (ball.striker && ball.striker.toString() === playerIdStr) {
              runs += ball.runs || 0;
              balls += 1;
              
              if (ball.runs === 4) fours += 1;
              if (ball.runs === 6) sixes += 1;
            }
          });
        }
        
        // Over history se data
        if (score.overHistory) {
          score.overHistory.forEach(over => {
            if (over.balls) {
              over.balls.forEach(ball => {
                if (ball.striker && ball.striker.toString() === playerIdStr) {
                  runs += ball.runs || 0;
                  balls += 1;
                  
                  if (ball.runs === 4) fours += 1;
                  if (ball.runs === 6) sixes += 1;
                }
              });
            }
          });
        }
      });
      
      return {
        runs,
        balls,
        fours,
        sixes,
        strikeRate: balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0
      };
    };

    // ✅ IMPROVED FUNCTION: Calculate bowling stats from ALL over data
    const calculateBowlingStatsFromAllOvers = (playerId, inningsNumber) => {
      if (!playerId || !match.scores || match.scores.length === 0) return null;
      
      const playerIdStr = playerId.toString();
      let overs = 0;
      let runsConceded = 0;
      let wickets = 0;
      let wides = 0;
      let noBalls = 0;
      let maidens = 0;
      
      // Har score (innings) check karo
      match.scores.forEach(score => {
        // Sirf current innings ke data ko consider karo
        if ((score.innings || 1) !== inningsNumber) return;
        
        // Current over se data
        if (score.currentOver && score.currentOver.balls && score.currentOver.balls.length > 0) {
          const firstBallBowler = score.currentOver.balls[0]?.bowler;
          if (firstBallBowler && firstBallBowler.toString() === playerIdStr) {
            let overRuns = 0;
            let overWickets = 0;
            let overWides = 0;
            let overNoBalls = 0;
            let validBalls = 0;
            
            score.currentOver.balls.forEach(ball => {
              if (ball.bowler && ball.bowler.toString() === playerIdStr) {
                overRuns += ball.runs || 0;
                
                if (ball.wicket) overWickets += 1;
                if (ball.isWide) overWides += 1;
                if (ball.isNoBall) overNoBalls += 1;
                
                // Valid balls count (excluding wides and no-balls)
                if (!ball.isWide && !ball.isNoBall) {
                  validBalls += 1;
                }
              }
            });
            
            runsConceded += overRuns;
            wickets += overWickets;
            wides += overWides;
            noBalls += overNoBalls;
            
            // Calculate overs from valid balls
            overs += validBalls / 6;
          }
        }
        
        // Over history se data
        if (score.overHistory) {
          score.overHistory.forEach(over => {
            if (over.balls && over.balls.length > 0) {
              const firstBallBowler = over.balls[0]?.bowler;
              if (firstBallBowler && firstBallBowler.toString() === playerIdStr) {
                let overRuns = 0;
                let overWickets = 0;
                let overWides = 0;
                let overNoBalls = 0;
                let isMaiden = true;
                let validBalls = 0;
                
                over.balls.forEach(ball => {
                  if (ball.bowler && ball.bowler.toString() === playerIdStr) {
                    overRuns += ball.runs || 0;
                    
                    if (ball.wicket) overWickets += 1;
                    if (ball.isWide) overWides += 1;
                    if (ball.isNoBall) overNoBalls += 1;
                    
                    // Valid balls count (excluding wides and no-balls)
                    if (!ball.isWide && !ball.isNoBall) {
                      validBalls += 1;
                      // Maiden over check (no runs excluding extras)
                      if ((ball.runs || 0) > 0) {
                        isMaiden = false;
                      }
                    }
                  }
                });
                
                runsConceded += overRuns;
                wickets += overWickets;
                wides += overWides;
                noBalls += overNoBalls;
                overs += 1; // Each completed over in history is 1 over
                
                if (isMaiden && validBalls >= 6) {
                  maidens += 1;
                }
              }
            }
          });
        }
      });
      
      // Calculate economy rate
      const economy = overs > 0 ? parseFloat((runsConceded / overs).toFixed(2)) : 0;
      
      return {
        overs: parseFloat(overs.toFixed(1)),
        runsConceded,
        wickets,
        wides,
        noBalls,
        maidens,
        economy
      };
    };

    // ✅ FUNCTION: Get current batsmen stats with detailed information
    const getCurrentBatsmenStats = () => {
      const strikerStats = currentPlayers.currentStriker ? 
        calculateBattingStatsFromAllOvers(currentPlayers.currentStriker._id, currentInnings) : null;
      
      const nonStrikerStats = currentPlayers.nonStriker ? 
        calculateBattingStatsFromAllOvers(currentPlayers.nonStriker._id, currentInnings) : null;

      // PlayersHistory se additional data lo
      const strikerHistory = currentPlayers.currentStriker ? 
        getPlayerDataFromHistory(currentPlayers.currentStriker._id, currentInnings) : null;
      
      const nonStrikerHistory = currentPlayers.nonStriker ? 
        getPlayerDataFromHistory(currentPlayers.nonStriker._id, currentInnings) : null;

      // Combine history and current over data
      const combineBattingStats = (currentStats, historyStats, player) => {
        if (!player) return null;

        let finalRuns = 0;
        let finalBalls = 0;
        let finalFours = 0;
        let finalSixes = 0;

        // Pehle history data lo (agar hai)
        if (historyStats) {
          finalRuns = historyStats.runs || 0;
          finalBalls = historyStats.balls || 0;
          finalFours = historyStats.fours || 0;
          finalSixes = historyStats.sixes || 0;
        }

        // Phir current over data add karo
        if (currentStats) {
          finalRuns += currentStats.runs || 0;
          finalBalls += currentStats.balls || 0;
          finalFours += currentStats.fours || 0;
          finalSixes += currentStats.sixes || 0;
        }

        const strikeRate = finalBalls > 0 ? parseFloat(((finalRuns / finalBalls) * 100).toFixed(2)) : 0;

        return {
          playerId: player._id,
          playerName: player.name,
          runs: finalRuns,
          balls: finalBalls,
          fours: finalFours,
          sixes: finalSixes,
          strikeRate: strikeRate,
          display: `${finalRuns}* (${finalBalls} balls)`,
          detailedDisplay: `${finalRuns}* (${finalBalls} balls, ${finalFours}x4, ${finalSixes}x6) SR: ${strikeRate}`
        };
      };

      return {
        striker: combineBattingStats(strikerStats, strikerHistory, currentPlayers.currentStriker),
        nonStriker: combineBattingStats(nonStrikerStats, nonStrikerHistory, currentPlayers.nonStriker)
      };
    };

    // ✅ FUNCTION: Get current bowler stats
    const getCurrentBowlerStats = () => {
      if (!currentPlayers.currentBowler) return null;

      const currentStats = calculateBowlingStatsFromAllOvers(currentPlayers.currentBowler._id, currentInnings);
      const historyStats = getPlayerDataFromHistory(currentPlayers.currentBowler._id, currentInnings);

      let finalOvers = 0;
      let finalRunsConceded = 0;
      let finalWickets = 0;
      let finalMaidens = 0;
      let finalWides = 0;
      let finalNoBalls = 0;

      // Pehle history data lo
      if (historyStats) {
        finalOvers = historyStats.overs || 0;
        finalRunsConceded = historyStats.runsConceded || 0;
        finalWickets = historyStats.wickets || 0;
        finalMaidens = historyStats.maidens || 0;
        finalWides = historyStats.wides || 0;
        finalNoBalls = historyStats.noBalls || 0;
      }

      // Phir current over data add karo
      if (currentStats) {
        finalOvers += currentStats.overs || 0;
        finalRunsConceded += currentStats.runsConceded || 0;
        finalWickets += currentStats.wickets || 0;
        finalMaidens += currentStats.maidens || 0;
        finalWides += currentStats.wides || 0;
        finalNoBalls += currentStats.noBalls || 0;
      }

      const economy = finalOvers > 0 ? parseFloat((finalRunsConceded / finalOvers).toFixed(2)) : 0;

      return {
        playerId: currentPlayers.currentBowler._id,
        playerName: currentPlayers.currentBowler.name,
        overs: parseFloat(finalOvers.toFixed(1)),
        runs: finalRunsConceded,
        wickets: finalWickets,
        maidens: finalMaidens,
        economy: economy,
        wides: finalWides,
        noBalls: finalNoBalls,
        display: `${parseFloat(finalOvers.toFixed(1))}-${finalMaidens}-${finalRunsConceded}-${finalWickets}`,
        detailedDisplay: `${parseFloat(finalOvers.toFixed(1))} overs, ${finalMaidens} maidens, ${finalRunsConceded} runs, ${finalWickets} wickets`
      };
    };

    // ✅ FUNCTION: Add status to team players WITH STATS
    const addStatusToTeamPlayers = (team, isBattingTeam = false) => {
      if (!team || !team.players) return team;

      const currentBatsmenStats = getCurrentBatsmenStats();
      const currentBowlerStats = getCurrentBowlerStats();

      return {
        _id: team._id,
        teamName: team.teamName,
        players: team.players.map(player => {
          const playerIdStr = player._id.toString();
          const basePlayer = {
            name: player.name,
            _id: player._id,
            status: player.status || 'Not Playing'
          };

          // Agar batting team hai to batsmen ke stats add karo
          if (isBattingTeam) {
            // Check if this is striker
            if (currentPlayers.currentStriker && currentPlayers.currentStriker._id.toString() === playerIdStr) {
              return {
                ...basePlayer,
                status: 'Batting (Striker)',
                stats: currentBatsmenStats.striker ? {
                  runs: currentBatsmenStats.striker.runs,
                  balls: currentBatsmenStats.striker.balls,
                  fours: currentBatsmenStats.striker.fours,
                  sixes: currentBatsmenStats.striker.sixes,
                  strikeRate: currentBatsmenStats.striker.strikeRate,
                  display: currentBatsmenStats.striker.display
                } : null
              };
            }
            // Check if this is non-striker
            else if (currentPlayers.nonStriker && currentPlayers.nonStriker._id.toString() === playerIdStr) {
              return {
                ...basePlayer,
                status: 'Batting (Non-Striker)',
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
          }
          // Agar bowling team hai to bowler ke stats add karo
          else {
            // Check if this is current bowler
            if (currentPlayers.currentBowler && currentPlayers.currentBowler._id.toString() === playerIdStr) {
              return {
                ...basePlayer,
                status: 'Bowling',
                stats: currentBowlerStats ? {
                  overs: currentBowlerStats.overs,
                  runs: currentBowlerStats.runs,
                  wickets: currentBowlerStats.wickets,
                  maidens: currentBowlerStats.maidens,
                  economy: currentBowlerStats.economy,
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
      const totalInnings = match.totalInnings || 2;

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
        totalInnings,
        matchStatus: match.status || 'live',
        toss: match.toss || {},
        decision: match.decision || 'bat',
        battingStatus: battingStatus,
        bowlingStatus: bowlingStatus
      };
    };

    const teamStatus = determineTeamStatus();

    // ✅ CREATE TEAMS WITH STATUS AND STATS
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

    // ✅ FIXED COMPLETE SCORECARD GENERATION
    const generateScorecard = () => {
      if (!match.scores || match.scores.length === 0) {
        return { innings: [], matchSummary: {} };
      }

      const inningsData = [];
      const totalInnings = match.totalInnings || 2;

      // Har innings ke liye data prepare karo
      for (let i = 0; i < Math.min(match.scores.length, totalInnings); i++) {
        const score = match.scores[i];
        const inningsNumber = score.innings || i + 1;
        
        // Determine batting and bowling teams
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

        // ✅ FIXED: Batting data - COMBINE ALL DATA SOURCES
        const battingData = [];
        
        // Batting team ke saare players
        const battingTeamPlayers = inningsNumber === 1 ? team1WithStatus.players : team2WithStatus.players;
        
        battingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          
          // ✅ STEP 1: PlayersHistory se actual data lo
          const playerInHistory = getPlayerDataFromHistory(teamPlayer._id, inningsNumber);
          
          // ✅ STEP 2: All overs se real-time data calculate karo
          const allOversStats = calculateBattingStatsFromAllOvers(teamPlayer._id, inningsNumber);
          
          // ✅ STEP 3: Combine both data sources - PRIORITIZE HISTORY DATA
          let finalRuns = 0;
          let finalBalls = 0;
          let finalFours = 0;
          let finalSixes = 0;
          
          // Pehle history data use karo (yeh primary source hai)
          if (playerInHistory) {
            finalRuns = playerInHistory.runs || 0;
            finalBalls = playerInHistory.balls || 0;
            finalFours = playerInHistory.fours || 0;
            finalSixes = playerInHistory.sixes || 0;
          }
          
          // Agar history data nahi hai to all overs data use karo
          if (!playerInHistory && allOversStats) {
            finalRuns = allOversStats.runs || 0;
            finalBalls = allOversStats.balls || 0;
            finalFours = allOversStats.fours || 0;
            finalSixes = allOversStats.sixes || 0;
          }
          
          // Calculate strike rate
          const strikeRate = finalBalls > 0 ? 
            parseFloat(((finalRuns / finalBalls) * 100).toFixed(2)) : 0;
          
          // Determine player status and dismissal
          let status = 'Not Played Yet';
          let isNotOut = true;
          let dismissal = '';
          
          if (playerInHistory) {
            isNotOut = !(playerInHistory.isOut || (playerInHistory.dismissals && playerInHistory.dismissals.trim() !== ''));
            dismissal = playerInHistory.dismissals || '';
          }
          
          // Check if currently batting
          if (currentPlayers.currentStriker && currentPlayers.currentStriker._id.toString() === playerIdStr) {
            status = 'Batting (Striker)';
            isNotOut = true;
          } else if (currentPlayers.nonStriker && currentPlayers.nonStriker._id.toString() === playerIdStr) {
            status = 'Batting (Non-Striker)';
            isNotOut = true;
          } else if (finalBalls > 0 || finalRuns > 0) {
            status = isNotOut ? 'Batting Completed (Not Out)' : 'Out';
          } else {
            status = 'Not Played Yet';
          }
          
          battingData.push({
            playerId: teamPlayer._id,
            playerName: playerName,
            runs: finalRuns,
            balls: finalBalls,
            fours: finalFours,
            sixes: finalSixes,
            strikeRate: strikeRate,
            dismissal: dismissal,
            isNotOut: isNotOut,
            status: status
          });
        });

        // ✅ FIXED: Bowling data - COMBINE ALL DATA SOURCES
        const bowlingData = [];
        
        // Bowling team ke saare players
        const bowlingTeamPlayers = inningsNumber === 1 ? team2WithStatus.players : team1WithStatus.players;
        
        bowlingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          
          // ✅ STEP 1: PlayersHistory se actual data lo
          const playerInHistory = getPlayerDataFromHistory(teamPlayer._id, inningsNumber);
          
          // ✅ STEP 2: All overs se real-time data calculate karo
          const allOversStats = calculateBowlingStatsFromAllOvers(teamPlayer._id, inningsNumber);
          
          // ✅ STEP 3: Combine both data sources - PRIORITIZE HISTORY DATA
          let finalOvers = 0;
          let finalRunsConceded = 0;
          let finalWickets = 0;
          let finalWides = 0;
          let finalNoBalls = 0;
          let finalMaidens = 0;
          
          // Pehle history data use karo (yeh primary source hai)
          if (playerInHistory) {
            finalOvers = playerInHistory.overs || 0;
            finalRunsConceded = playerInHistory.runsConceded || 0;
            finalWickets = playerInHistory.wickets || 0;
            finalWides = playerInHistory.wides || 0;
            finalNoBalls = playerInHistory.noBalls || 0;
            finalMaidens = playerInHistory.maidens || 0;
          }
          
          // Agar history data nahi hai to all overs data use karo
          if (!playerInHistory && allOversStats) {
            finalOvers = allOversStats.overs || 0;
            finalRunsConceded = allOversStats.runsConceded || 0;
            finalWickets = allOversStats.wickets || 0;
            finalWides = allOversStats.wides || 0;
            finalNoBalls = allOversStats.noBalls || 0;
            finalMaidens = allOversStats.maidens || 0;
          }
          
          // Calculate economy rate
          const economy = finalOvers > 0 ? 
            parseFloat((finalRunsConceded / finalOvers).toFixed(2)) : 0;
          
          // Determine player status
          let status = 'Not Played Yet';
          
          // Check if currently bowling
          if (currentPlayers.currentBowler && currentPlayers.currentBowler._id.toString() === playerIdStr) {
            status = 'Bowling';
          } else if (finalOvers > 0 || finalWickets > 0 || finalRunsConceded > 0) {
            status = 'Bowling Completed';
          } else {
            status = 'Not Played Yet';
          }
          
          bowlingData.push({
            playerId: teamPlayer._id,
            playerName: playerName,
            overs: parseFloat(finalOvers.toFixed(1)),
            maidens: finalMaidens,
            runs: finalRunsConceded,
            wickets: finalWickets,
            economy: economy,
            wides: finalWides,
            noBalls: finalNoBalls,
            status: status
          });
        });

        // Extras calculate karo
        const extras = {
          wides: score.wides || 0,
          noBalls: score.noBalls || 0,
          byes: score.byes || 0,
          legByes: score.legByes || 0,
          penalties: score.penalties || 0,
          total: (score.wides || 0) + (score.noBalls || 0) + (score.byes || 0) + (score.legByes || 0) + (score.penalties || 0)
        };

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
          fallOfWickets: score.fallOfWickets || []
        });
      }

      // Match summary prepare karo
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
        matchType: match.matchType
      };

      return {
        innings: inningsData,
        matchSummary: matchSummary
      };
    };

    const scorecard = generateScorecard();

    // ✅ FINAL RESPONSE
    return res.status(200).json({
      success: true,
      match: {
        ...match._doc,
        team1: team1WithStatus,
        team2: team2WithStatus,
        scorecard: scorecard,
        liveData: liveData,
        currentPlayers: {
          striker: currentBatsmenStats.striker,
          nonStriker: currentBatsmenStats.nonStriker,
          bowler: currentBowlerStats
        }
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
        message: "All fields are required: tossWinner, electedTo, striker, nonStriker, bowler, bowlingStyle",
      });
    }

    // Update match basic info
    match.status = "Live";
    match.toss = {
      winner: tossWinner,
      elected: electedTo,
    };
    match.opening = {
      striker,
      nonStriker,
    };
    match.bowling = {
      bowler,
      style: bowlingStyle,
    };

    // 🔄 Update players' statuses
    for (let teamId of [match.team1, match.team2]) {
      const team = await Team.findById(teamId);
      if (!team) continue;

      team.players = team.players.map((player) => {
        const playerId = player._id.toString();

        if (playerId === striker) {
          return { ...player.toObject(), status: "Batting (Striker)" };
        } else if (playerId === nonStriker) {
          return { ...player.toObject(), status: "Batting (Non-Striker)" };
        } else if (playerId === bowler) {
          return { ...player.toObject(), status: "Bowling" };
        } else {
          return player;
        }
      });

      await team.save();
    }

    // Save updated match
    await match.save();

    // Fetch updated match & teams
    const team1 = await Team.findById(match.team1);
    const team2 = await Team.findById(match.team2);

    return res.status(200).json({
      success: true,
      message: "Match started successfully",
      match: {
        _id: match._id,
        toss: match.toss,
        status: match.status,
        opening: match.opening,
        bowling: match.bowling,
        matchFormat: match.matchFormat,
        inningStatus: match.inningStatus,
        currentInnings: match.currentInnings || 1,
        totalInnings: match.totalInnings,
        team1: {
          _id: team1._id,
          teamName: team1.teamName,
          players: team1.players,
        },
        team2: {
          _id: team2._id,
          teamName: team2.teamName,
          players: team2.players,
        }
      }
    });

  } catch (error) {
    console.error("Error starting match:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
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
      locationName, // ✅ new field
      numberOfTeams,
      format,
      tournamentType,
      rules,
      prizes,
      price
    } = req.body;

    // ✅ Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // ✅ Optional: Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Required fields check
    if (
      !name || !startDate || !endDate || !registrationEndDate ||
      !location || !location.lat || !location.lng ||
      !locationName || // ✅ ensure locationName is provided
      !numberOfTeams || !format || !tournamentType
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ If tournamentType is 'paid', price must be provided
    if (tournamentType === 'paid' && (price === undefined || price === null)) {
      return res.status(400).json({ message: "Price is required for paid tournaments" });
    }

    // ✅ If tournamentType is 'free', force price to null
    const finalPrice = tournamentType === 'free' ? null : price;

    const newTournament = new Tournament({
      name,
      description,
      startDate,
      endDate,
      registrationEndDate,
      location,
      locationName, // ✅ include in document
      numberOfTeams,
      format,
      tournamentType,
      price: finalPrice,
      rules,
      prizes,
      createdBy: userId
    });

    await newTournament.save();

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament: newTournament
    });

  } catch (error) {
    console.error("Error creating tournament:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
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

    // ✅ 1. MATCH STATUS UPDATE
    if (matchStatus) {
      match.status = matchStatus;
      if (matchStatus === 'completed') {
        match.endTime = new Date();
      } else if (matchStatus === 'live' && match.status === 'upcoming') {
        match.startTime = new Date();
      }
      
      await match.save();
      return res.status(200).json({
        success: true,
        message: `Match status updated to ${matchStatus}`,
        match: match
      });
    }

    // ✅ 2. INNING STATUS UPDATE - RETURN HATA DIYA
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
        const bowlingTeam = firstInningsBattingTeam === match.team1 ? match.team1 : match.team2;
        
        console.log(`🎯 Batting Team: ${battingTeam}, Bowling Team: ${bowlingTeam}`);
        
        const battingTeamData = await Team.findById(battingTeam);
        if (battingTeamData) {
          console.log(`🔄 Resetting batting team: ${battingTeamData.teamName}`);
          
          battingTeamData.players = battingTeamData.players.map(player => ({
            ...player.toObject(),
            status: "Yet to Bat"
          }));
          
          if (battingTeamData.players.length >= 2) {
            battingTeamData.players[0].status = "Batting (Striker)";
            battingTeamData.players[1].status = "Batting (Non-Striker)";
            
            // ✅ YAHAN DEFAULT SET KARDO, BAAD MEIN OVERRIDE HO JAYEGA
            match.currentStriker = battingTeamData.players[0]._id;
            match.nonStriker = battingTeamData.players[1]._id;
            
            console.log(`🎯 Openers set: Striker - ${match.currentStriker}, Non-Striker - ${match.nonStriker}`);
          } else {
            console.log(`❌ Not enough players in batting team`);
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
          
          if (bowlingTeamData.players.length > 0) {
            bowlingTeamData.players[0].status = "Bowling";
            // ✅ YAHAN DEFAULT SET KARDO, BAAD MEIN OVERRIDE HO JAYEGA
            match.currentBowler = bowlingTeamData.players[0]._id;
            console.log(`🎯 Opening bowler set: ${match.currentBowler}`);
          } else {
            console.log(`❌ No players in bowling team`);
          }
          
          await bowlingTeamData.save();
          console.log(`✅ Bowling team updated for second innings`);
        } else {
          console.log(`❌ Bowling team not found`);
        }
        
        console.log(`🎯 Second innings setup completed. Target: ${match.target}`);
      }
      
      await match.save();
      
      // ❌ RETURN STATEMENT COMMENT OUT KAR DIYA
      console.log(`✅ Inning status updated to ${inningStatus}, continuing with player updates...`);
    }

    // ✅ 3. SWAP STRIKER
    if (swapStriker) {
      console.log(`🔄 Swapping striker and non-striker`);
      
      const temp = match.currentStriker;
      match.currentStriker = match.nonStriker;
      match.nonStriker = temp;
      
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
      
      return res.status(200).json({
        success: true,
        message: "Striker swapped successfully",
        match: match
      });
    }

    // ✅ 4. BOWLER CHANGE
    if (bowler && changeBowler) {
      match.currentBowler = bowler;
      
      // Team schema mein bowler status update karo
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (player.status === "Bowling") {
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
      
      return res.status(200).json({
        success: true,
        message: "Bowler changed successfully",
        match: match
      });
    }

    // ✅ 5. DIRECT PLAYER UPDATES (Agar inningStatus ke saath aaye hain)
    let playersUpdated = false;
    
    if (striker && striker !== match.currentStriker?.toString()) {
      console.log(`🔄 Updating striker from ${match.currentStriker} to ${striker}`);
      match.currentStriker = striker;
      playersUpdated = true;
      
      // Team schema update for striker
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (playerId === striker.toString()) {
            return { ...player.toObject(), status: "Batting (Striker)" };
          }
          // Purane striker ko non-striker banao agar woh abhi bhi batting mein hai
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
      
      // Team schema update for bowler
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          if (playerId === bowler.toString()) {
            return { ...player.toObject(), status: "Bowling" };
          }
          // Purane bowler ko fielding mein bhejo
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
      return res.status(200).json({
        success: true,
        message: "Players updated successfully",
        match: match,
        target: match.target
      });
    }

    // ✅ 6. STRIKER CHANGE (without wicket)
    if (striker && newBatsman && !wickets) {
      console.log(`🔄 Changing striker from ${match.currentStriker} to ${newBatsman}`);
      
      match.currentStriker = newBatsman;
      
      // Team schema mein player status update karo
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          // Purane striker ko fielding mein bhejo
          if (player.status === "Batting (Striker)") {
            return { ...player.toObject(), status: "Fielding" };
          }
          // Naye striker ko batting status do
          else if (playerId === newBatsman.toString()) {
            return { ...player.toObject(), status: "Batting (Striker)" };
          }
          return player;
        });

        await team.save();
      }
      
      await match.save();
      
      return res.status(200).json({
        success: true,
        message: "Striker changed successfully",
        match: match
      });
    }

    // ✅ 7. UNDO LAST BALL
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
          
          // Agar last over empty ho gaya, to use remove karo
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
      
      // Extra type ke hisab se runs calculate karo
      if (lastBall.extraType === 'noball') {
        runsToSubtract += 1; // No ball penalty
      } else if (lastBall.extraType === 'wide') {
        runsToSubtract += 1; // Wide penalty
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
          
          // Striker ki wicket undo karo
          if (lastBall.striker) {
            const strikerStats = playersHistoryThisInnings.find(p => 
              p.playerId && p.playerId.toString() === lastBall.striker.toString()
            );
            if (strikerStats) {
              strikerStats.isOut = false;
              strikerStats.dismissals = "";
              // Ball count bhi adjust karo agar legal delivery thi
              if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
                strikerStats.balls -= 1;
              }
            }
          }

          // Bowler se wicket undo karo
          if (lastBall.bowler && lastBall.dismissalType && 
              ['bowled', 'caught', 'lbw', 'stumped', 'hitwicket'].includes(lastBall.dismissalType)) {
            const bowlerStats = playersHistoryThisInnings.find(p => 
              p.playerId && p.playerId.toString() === lastBall.bowler.toString()
            );
            if (bowlerStats) {
              bowlerStats.wickets -= 1;
            }
          }

          // New batsman ko remove karo
          if (lastBall.newBatsman) {
            const newBatsmanStats = playersHistoryThisInnings.find(p => 
              p.playerId && p.playerId.toString() === lastBall.newBatsman.toString()
            );
            if (newBatsmanStats && newBatsmanStats.runs === 0 && newBatsmanStats.balls === 0) {
              // Agar new batsman ne kuch nahi kiya, to use remove karo
              inningsHistory.players = playersHistoryThisInnings.filter(p => 
                p.playerId.toString() !== lastBall.newBatsman.toString()
              );
            }
          }
        }

        // Team schema mein player status undo karo
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (!team) continue;

          team.players = team.players.map((player) => {
            const playerId = player._id.toString();

            // Out player ko wapas batting mein le aao
            if (lastBall.striker && playerId === lastBall.striker.toString()) {
              return { ...player.toObject(), status: "Batting (Striker)" };
            }
            // New batsman ko fielding mein bhejo
            else if (lastBall.newBatsman && playerId === lastBall.newBatsman.toString()) {
              return { ...player.toObject(), status: "Fielding" };
            }
            return player;
          });

          await team.save();
        }

        // Striker ko wapas set karo
        match.currentStriker = lastBall.striker;
      }

      // ✅ PLAYER STATS UNDO KARO
      const inningsHistory = match.playersHistory.find(inn => inn.innings === innings);
      if (inningsHistory) {
        const playersHistoryThisInnings = inningsHistory.players;

        // Striker stats undo
        if (lastBall.striker && !lastBall.wicket) {
          const strikerStats = playersHistoryThisInnings.find(p => 
            p.playerId && p.playerId.toString() === lastBall.striker.toString()
          );
          if (strikerStats) {
            strikerStats.runs -= (lastBall.runs || 0);
            if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
              strikerStats.balls -= 1;
            }
            // Four/Six undo
            if (lastBall.runs === 4) strikerStats.fours -= 1;
            if (lastBall.runs === 6) strikerStats.sixes -= 1;
          }
        }

        // Bowler stats undo
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
            }
            
            bowlerStats.runsConceded -= runsConcededToSubtract;
            
            // Legal delivery thi to ball count undo karo
            if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
              bowlerStats.balls -= 1;
            }
          }
        }
      }

      // ✅ OVER MANAGEMENT UNDO
      // Current over runs update karo
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
      }

      // ✅ OVERS COUNT UNDO
      let [ov, b] = scoreData.overs.toString().split(".").map(Number);
      
      // Legal delivery thi to ball count kam karo
      if (lastBall.extraType !== 'wide' && lastBall.extraType !== 'noball') {
        b -= 1;
      }

      // Agar ball count negative hai, to previous over mein jao
      if (b < 0) {
        ov -= 1;
        b = 5; // Previous over ki 5 balls
      }

      scoreData.overs = parseFloat(`${ov}.${b}`);
      match.overs = scoreData.overs;

      // ✅ RUN RATE RECALCULATE KARO
      scoreData.runRate = scoreData.overs > 0 ? 
        parseFloat((scoreData.runs / scoreData.overs).toFixed(2)) : 0;
      match.runRate = scoreData.runRate;

      // ✅ COMMENTARY UNDO - Last commentary remove karo
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

      console.log(`⏪ Undo completed. New score: ${scoreData.runs}/${scoreData.wickets} in ${scoreData.overs} overs`);
      
      const savedMatch = await match.save();
      
      return res.status(200).json({
        success: true,
        message: "Last ball undone successfully",
        match: savedMatch
      });
    }

    // ✅ 8. MAIN BALL UPDATE LOGIC
    if (ballUpdate) {
      // ✅ CURRENT INNINGS CHECK - AGAR SECOND INNINGS HAI TO TARGET SHOW KARO
      const currentInningsIndex = innings - 1;
      const isSecondInnings = innings === 2;
      
      console.log(`🎯 Ball update for innings ${innings}, Second innings: ${isSecondInnings}, Target: ${match.target}`);

      // Current innings ensure karo
      if (!match.scores[currentInningsIndex]) {
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

      // PlayersHistory ensure karo
      if (!match.playersHistory.find(inn => inn.innings === innings)) {
        match.playersHistory.push({
          innings: innings,
          players: []
        });
      }

      const inningsHistory = match.playersHistory.find(inn => inn.innings === innings);
      const playersHistoryThisInnings = inningsHistory.players;

      // ✅ FIXED: GET NEXT BALL NUMBER FUNCTION - COMPLETELY REWRITTEN
      const getNextBallNumber = () => {
        const currentBalls = scoreData.currentOver.balls;
        
        // ✅ COMPLETE FIX: Agar current over empty hai, toh 1 return karo
        if (currentBalls.length === 0) {
          console.log(`🎯 First ball of over ${scoreData.currentOver.overNumber}, ball number: 1`);
          return 1;
        }
        
        // ✅ COMPLETE FIX: Last ball ka number lo aur +1 karo
        const lastBallNumber = currentBalls[currentBalls.length - 1].ballNumber;
        const nextBall = lastBallNumber + 1;
        console.log(`🎯 Last ball number: ${lastBallNumber}, Next ball number: ${nextBall}`);
        return nextBall;
      };

      // ✅ IMPROVED PLAYER UPDATE FUNCTION WITH BOWLER CHECK
      const updatePlayerStats = (playerId, updates) => {
        // ✅ BOWLER CHECK ADD KARO - Agar playerId undefined hai to return karo
        if (!playerId) {
          console.log(`⚠️ Player ID undefined, skipping update`);
          return;
        }

        let playerStats = playersHistoryThisInnings.find(p => 
          p.playerId && p.playerId.toString() === playerId.toString()
        );

        if (!playerStats) {
          playerStats = {
            playerId: playerId,
            runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0,
            wickets: 0, overs: 0, runsConceded: 0, maidens: 0, economy: 0,
            wides: 0, noBalls: 0, dismissals: "", isOut: false
          };
          playersHistoryThisInnings.push(playerStats);
        }

        // Stats update karo
        if (updates.runs !== undefined) {
          playerStats.runs += updates.runs;
          if (updates.runs === 4) playerStats.fours += 1;
          if (updates.runs === 6) playerStats.sixes += 1;
        }
        if (updates.balls !== undefined) playerStats.balls += updates.balls;
        if (updates.runsConceded !== undefined) playerStats.runsConceded += updates.runsConceded;
        if (updates.wickets !== undefined) playerStats.wickets += updates.wickets;
        if (updates.overs !== undefined) playerStats.overs += updates.overs;
        if (updates.wides !== undefined) playerStats.wides += updates.wides;
        if (updates.noBalls !== undefined) playerStats.noBalls += updates.noBalls;
        if (updates.dismissal) playerStats.dismissals = updates.dismissal;
        if (updates.isOut !== undefined) playerStats.isOut = updates.isOut;

        // Rates calculate karo
        if (playerStats.balls > 0) {
          playerStats.strikeRate = parseFloat(((playerStats.runs / playerStats.balls) * 100).toFixed(2));
        }
        if (playerStats.overs > 0) {
          playerStats.economy = parseFloat((playerStats.runsConceded / playerStats.overs).toFixed(2));
        }

        return playerStats;
      };

      let ballRuns = Number(runs) || 0;
      let ballWicket = (Number(wickets) || 0) > 0;
      let isLegalDelivery = true;
      let commentaryLine = "";

      // ✅ EXTRA TYPE CHECK - NO BALL AUR WIDE MEIN BALL COUNT NAHI BADHEGA
      if (extraType === 'wide' || extraType === 'noball') {
        isLegalDelivery = false;
      }

      // ✅ RUNS ADD KARO - NO BALL FIX
      if (runs !== undefined) {
        let runsToAdd = ballRuns;
        
        // ✅ NO BALL FIX: No ball ka 1 run extra hota hai + boundary runs
        if (extraType === 'noball') {
          runsToAdd = ballRuns + 1; // No ball ka 1 run + boundary runs
          console.log(`🎯 No Ball: ${ballRuns} boundary runs + 1 penalty = ${runsToAdd} total runs`);
        }
        // ✅ WIDE FIX: Wide runs + 1 penalty
        else if (extraType === 'wide') {
          runsToAdd = ballRuns + 1; // Wide runs + 1 penalty
          console.log(`🎯 Wide: ${ballRuns} extra runs + 1 penalty = ${runsToAdd} total runs`);
        }

        scoreData.runs += runsToAdd;
        match.runs = scoreData.runs;

        // Regular runs (no extra)
        if (!extraType) {
          if (striker) {
            updatePlayerStats(striker, { runs: ballRuns, balls: isLegalDelivery ? 1 : 0 });
          }
          // ✅ BOWLER CHECK - Agar bowler hai tabhi update karo
          if (bowler) {
            updatePlayerStats(bowler, { runsConceded: ballRuns, balls: isLegalDelivery ? 1 : 0 });
          }
          // Commentary for regular runs
          if (ballRuns === 0) commentaryLine = "Dot ball";
          else if (ballRuns === 4) commentaryLine = "FOUR!";
          else if (ballRuns === 6) commentaryLine = "SIX!";
          else commentaryLine = `${ballRuns} run${ballRuns > 1 ? 's' : ''}`;
        }
        // Extra runs
        else {
          switch (extraType) {
            case 'wide':
              // ✅ BOWLER CHECK - Agar bowler hai tabhi update karo
              if (bowler) {
                updatePlayerStats(bowler, { 
                  runsConceded: runsToAdd, // Total runs (boundary + penalty)
                  wides: 1 
                });
              }
              commentaryLine = `WIDE! ${runsToAdd} run${runsToAdd > 1 ? 's' : ''}${ballRuns > 0 ? ` (${ballRuns} boundary)` : ''}`;
              break;
              
            case 'noball':
              // ✅ BOWLER CHECK - Agar bowler hai tabhi update karo
              if (bowler) {
                updatePlayerStats(bowler, { 
                  runsConceded: runsToAdd, // Total runs (boundary + penalty)
                  noBalls: 1 
                });
              }
              // ✅ NO BALL PE BATSMAN KO BOUNDARY RUNS MILENGE
              if (striker && ballRuns > 0) {
                updatePlayerStats(striker, { runs: ballRuns });
              }
              commentaryLine = `NO BALL! ${runsToAdd} run${runsToAdd > 1 ? 's' : ''}${ballRuns > 0 ? ` (${ballRuns} boundary)` : ''}`;
              break;
              
            case 'bye':
              commentaryLine = `${ballRuns} BYE${ballRuns > 1 ? 's' : ''}`;
              break;
            case 'legbye':
              commentaryLine = `${ballRuns} LEG BYE${ballRuns > 1 ? 's' : ''}`;
              break;
          }
        }
      }

      // ✅ WICKET ADD KARO - COMPLETE DISMISSAL TYPE HANDLING
      if (ballWicket) {
        scoreData.wickets += 1;
        match.wickets = scoreData.wickets;

        console.log(`🎯 Wicket taken! Dismissal Type: ${dismissalType}, Striker: ${striker}`);

        // ✅ DISMISSAL TYPE KE HISAB SE PLAYER STATUS UPDATE
        if (striker) {
          // Striker ko out mark karo
          updatePlayerStats(striker, { 
            dismissal: dismissalType, 
            balls: isLegalDelivery ? 1 : 0, 
            isOut: true 
          });

          // Dismissal type ke hisab se commentary
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

        // ✅ BOWLER KO WICKET CREDIT - Sirf jab bowler responsible ho AUR BOWLER EXIST KARTA HO
        if (bowler && isLegalDelivery && 
            ['bowled', 'caught', 'lbw', 'stumped', 'hitwicket'].includes(dismissalType)) {
          updatePlayerStats(bowler, { wickets: 1 });
          console.log(`🎯 Wicket credited to bowler: ${bowler}`);
        }

        // ✅ NEW BATSMAN ADD KARO (Agar provided hai)
        if (newBatsman) {
          match.currentStriker = newBatsman;
          updatePlayerStats(newBatsman, { runs: 0, balls: 0, isOut: false });
          commentaryLine += ` New batsman arrives.`;
          console.log(`🔄 New batsman: ${newBatsman}`);
        } else {
          // Agar new batsman nahi hai, to striker ko hi null karo
          match.currentStriker = null;
        }

        // ✅ 🚨 TEAM SCHEMA MEIN PLAYER STATUS UPDATE KARO
        console.log(`🔄 Updating team schema for wicket...`);
        for (let teamId of [match.team1, match.team2]) {
          const team = await Team.findById(teamId);
          if (!team) continue;

          team.players = team.players.map((player) => {
            const playerId = player._id.toString();

            // Out hone wale player ka status "Out" karo
            if (striker && playerId === striker.toString()) {
              console.log(`🎯 Marking player as OUT: ${playerId}`);
              return { ...player.toObject(), status: "Out" };
            }
            // New batsman ka status "Batting (Striker)" karo
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

      // ✅ FIXED: BALL NUMBER CALCULATION - COMPLETELY REWRITTEN
      const nextBallNumber = getNextBallNumber();
      console.log(`🎯 Final Ball Number: ${nextBallNumber}, Extra Type: ${extraType}, Legal Delivery: ${isLegalDelivery}`);

      // ✅ OVER MANAGEMENT
      // Ball data banayo
      const ballData = {
        ballNumber: nextBallNumber, // ✅ FIXED: CORRECT BALL NUMBER
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

      // Current over mein add karo
      scoreData.currentOver.balls.push(ballData);
      
      // ✅ OVER RUNS UPDATE FIX: Actual runs hi add karo, penalty runs nahi
      if (extraType === 'noball') {
        scoreData.currentOver.runs += (ballRuns + 1); // Boundary + penalty
      } else if (extraType === 'wide') {
        scoreData.currentOver.runs += (ballRuns + 1); // Extra runs + penalty  
      } else {
        scoreData.currentOver.runs += ballRuns;
      }
      
      if (ballWicket) scoreData.currentOver.wickets += 1;

      // ✅ FIXED: OVER HISTORY MANAGEMENT - PEHLI BALL SE HI BALLS ARRAY MEIN ADD KARO
      let currentOverInHistory = scoreData.overHistory.find(over => 
        over.overNumber === scoreData.currentOver.overNumber
      );
      
      if (!currentOverInHistory) {
        currentOverInHistory = {
          overNumber: scoreData.currentOver.overNumber,
          runs: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
          balls: [] // ✅ FIXED: Initialize with empty array
        };
        scoreData.overHistory.push(currentOverInHistory);
        console.log(`🔄 Created new over in history: Over ${currentOverInHistory.overNumber}`);
      }

      // ✅ FIXED: HAR BALL KO OVER HISTORY MEIN BHI ADD KARO
      currentOverInHistory.balls.push(ballData);
      console.log(`✅ Added ball ${ballData.ballNumber} to over history ${currentOverInHistory.overNumber}`);
      
      // ✅ OVER HISTORY RUNS FIX
      if (extraType === 'noball') {
        currentOverInHistory.runs += (ballRuns + 1);
        currentOverInHistory.noBalls += 1;
      } else if (extraType === 'wide') {
        currentOverInHistory.runs += (ballRuns + 1);
        currentOverInHistory.wides += 1;
      } else {
        currentOverInHistory.runs += ballRuns;
      }
      
      if (ballWicket) currentOverInHistory.wickets += 1;

      // ✅ OVERS COUNT UPDATE - EXTRA TYPES MEIN BALL COUNT NAHI BADHEGA
      let [ov, b] = scoreData.overs.toString().split(".").map(Number);
      if (isNaN(ov)) ov = 0;
      if (isNaN(b)) b = 0;

      // ✅ YEH FIX KARO: Only legal deliveries mein ball count badhao
      if (isLegalDelivery) {
        b += 1;
      }

      // ✅ OVER COMPLETE? - BOWLER OVERS UPDATE FIXED WITH BOWLER CHECK
      if (b >= 6) {
        console.log(`🎯 Over completed! Bowler: ${bowler}, Over: ${ov}.${b}`);
        
        // ✅ BOWLER KO OVER COUNT DO - FIXED (WITH BOWLER CHECK)
        if (bowler) {
          updatePlayerStats(bowler, { overs: 1 }); // ✅ 1 over add karo
          
          // Maiden over check karo
          if (currentOverInHistory.runs === 0) {
            updatePlayerStats(bowler, { maidens: 1 });
            console.log(`🎯 Maiden over for bowler: ${bowler}`);
          }
          
          // ✅ SAFE CHECK FOR BOWLER STATS
          const bowlerStats = playersHistoryThisInnings.find(p => 
            p.playerId && p.playerId.toString() === bowler.toString()
          );
          console.log(`📊 Bowler ${bowler} overs updated to: ${bowlerStats?.overs || 0}`);
        }

        // Next over start karo
        ov += 1;
        b = 0;
        scoreData.currentOver = {
          overNumber: ov + 1,
          runs: 0,
          wickets: 0,
          balls: []
        };

        // Over complete commentary
        const overCommentary = `End of over ${ov}. Score: ${scoreData.runs}/${scoreData.wickets}`;
        scoreData.commentary.push(overCommentary);
        match.commentary.push(overCommentary);
        
        console.log(`🔄 Starting new over: ${ov + 1}`);
      }

      scoreData.overs = parseFloat(`${ov}.${b}`);
      match.overs = scoreData.overs;

      // Run rate calculate karo
      scoreData.runRate = scoreData.overs > 0 ? 
        parseFloat((scoreData.runs / scoreData.overs).toFixed(2)) : 0;
      match.runRate = scoreData.runRate;

      // ✅ CURRENT PLAYERS UPDATE (Only if not changed by wicket)
      if (striker && !ballWicket) {
        match.currentStriker = striker;
        
        // Team schema mein striker status update karo
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
        
        // Team schema mein non-striker status update karo
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
      
      // ✅ BOWLER UPDATE WITH SAFE CHECK
      if (bowler && !changeBowler) {
        match.currentBowler = bowler;
        
        // Team schema mein bowler status update karo
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

      console.log(`💾 Saving match data...`);
      console.log(`📊 Final Score: ${scoreData.runs}/${scoreData.wickets} in ${scoreData.overs} overs`);
      console.log(`🎯 Current Over Balls:`, scoreData.currentOver.balls.map(b => `Ball ${b.ballNumber}: ${b.runs} runs`));
      console.log(`📈 Over History:`, scoreData.overHistory.map(over => `Over ${over.overNumber}: ${over.balls.length} balls - ${over.balls.map(b => b.ballNumber).join(', ')}`));
      
      // ✅ DEBUG: Check bowler stats before save (WITH SAFE CHECK)
      if (bowler) {
        const bowlerStats = playersHistoryThisInnings.find(p => 
          p.playerId && p.playerId.toString() === bowler.toString()
        );
        if (bowlerStats) {
          console.log(`🎯 Bowler Final Stats - Overs: ${bowlerStats.overs}, Runs: ${bowlerStats.runsConceded}, Wickets: ${bowlerStats.wickets}`);
        }
      }

      // ✅ FINAL SAVE WITH TARGET INFORMATION
      const savedMatch = await match.save();
      console.log(`✅ Match saved successfully!`);

      // ✅ RESPONSE MEIN TARGET BHI SEND KARO AGAR SECOND INNINGS HAI
      const responseData = {
        success: true,
        message: "Ball updated successfully",
        match: savedMatch
      };

      if (isSecondInnings) {
        responseData.target = match.target;
        responseData.requiredRuns = Math.max(0, match.target - scoreData.runs);
        responseData.remainingWickets = 10 - scoreData.wickets;
        console.log(`🎯 Second innings update - Target: ${match.target}, Required: ${responseData.requiredRuns}`);
      }

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
    const { name, categoryId, scoringMethod, gameMode, players, teams, tournamentId, type } = req.body;

    // Validate creator (userId)
    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({ success: false, message: 'Creator not found' });
    }

    // Validate category
    const category = await GameCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Basic validation for scoringMethod and gameMode
    if (!scoringMethod || !gameMode) {
      return res.status(400).json({
        success: false,
        message: 'Scoring method and game mode are required',
      });
    }

    // Tournament-specific logic
    if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Tournament not found' });
      }
    }

    let playerEntries = [];
    if (gameMode === 'single') {
      if (!players || !Array.isArray(players) || players.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Players array is required for single game mode',
        });
      }

      // Prepare player entries for single mode
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
        return res.status(400).json({
          success: false,
          message: 'At least two teams are required for team game mode',
        });
      }

      // Prepare teams for team game mode
      for (const team of teams) {
        const existingTeam = await GameTeam.findById(team.teamId);
        if (!existingTeam) {
          return res.status(404).json({ success: false, message: `Team with ID ${team.teamId} not found` });
        }
        teamEntries.push({ teamId: existingTeam._id });
      }
    }

    // Create new match with or without tournament reference
    const newMatch = new GameMatch({
      name,
      categoryId,
      scoringMethod,
      gameMode,
      players: playerEntries, 
      teams: teamEntries,
      tournamentId: tournamentId,  // Add tournamentId if provided
      createdBy: creator._id,
      status: 'upcoming',
      createdAt: new Date(),
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
        tournamentId: newMatch.tournamentId,  // Include tournamentId in the response
        status: newMatch.status,
        createdBy: newMatch.createdBy,
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

    // Validate required params
    if (!userId || !matchId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Match ID are required ❌"
      });
    }

    // Validate user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found ❌" });
    }

    // Find match
    const match = await GameMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found ❌" });
    }

    // Optional: Check if the user is the creator of the match
    if (String(match.createdBy) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to start this match ❌",
      });
    }

    // Only allow starting if match is pending
    if (match.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Match cannot be started. Current status is '${match.status}' ❌`,
      });
    }

    // Update match status
    match.status = 'live';
    match.startedAt = new Date();

    await match.save();

    res.status(200).json({
      success: true,
      message: "Match started successfully ✅",
      match: {
        _id: match._id,
        name: match.name,
        status: match.status,
        startedAt: match.startedAt,
      },
    });

  } catch (error) {
    console.error('Error starting match:', error);
    res.status(500).json({ success: false, message: "Internal server error ❌" });
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

    if (!matchId) {
      return res.status(400).json({ success: false, message: 'Match ID is required' });
    }

    const match = await GameMatch.findById(matchId)
      .populate('createdBy', 'name')
      .populate('categoryId', 'name')
      .lean();

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Emit to the specific match room
    io.to(matchId).emit('singleMatchData', { match });

    return res.status(200).json({
      success: true,
      match,
    });

  } catch (error) {
    console.error('Error fetching match:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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
