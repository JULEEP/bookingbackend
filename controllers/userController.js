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

    // ✅ CURRENT PLAYERS ON FIELD - IMPROVED
    const getCurrentPlayers = () => {
      return {
        striker: match.currentStriker ? {
          id: match.currentStriker._id,
          name: match.currentStriker.name
        } : null,
        nonStriker: match.nonStriker ? {
          id: match.nonStriker._id,
          name: match.nonStriker.name
        } : null,
        bowler: match.currentBowler ? {
          id: match.currentBowler._id,
          name: match.currentBowler.name
        } : null
      };
    };

    const currentPlayers = getCurrentPlayers();
    const currentInnings = match.currentInnings || 1;

    // ✅ FIXED FUNCTION: Determine player status - PEHLE OUT STATUS CHECK KARO
    const getPlayerStatus = (playerId) => {
      if (!playerId) return 'Not Played Yet';
      
      const playerIdStr = playerId.toString();
      
      // ✅ 1. PEHLE CHECK KARO: Kya player out hai playersHistory mein?
      let isPlayerOut = false;
      let dismissalType = '';
      
      if (match.playersHistory && Array.isArray(match.playersHistory)) {
        // Sabhi innings mein check karo
        for (const innings of match.playersHistory) {
          const playerInInnings = innings.players.find(p => 
            p.playerId && p.playerId.toString() === playerIdStr
          );
          
          if (playerInInnings) {
            // Check if player is out in ANY innings
            if (playerInInnings.isOut || (playerInInnings.dismissals && playerInInnings.dismissals.trim() !== '')) {
              isPlayerOut = true;
              dismissalType = playerInInnings.dismissals || 'bowled';
              break;
            }
          }
        }
      }
      
      // ✅ AGAR PLAYER OUT HAI TOH DIRECTLY RETURN KARO
      if (isPlayerOut) {
        return `Out (${dismissalType})`;
      }
      
      // ✅ 2. AB CHECK KARO: Kya player currently on field hai?
      if (currentPlayers.striker && currentPlayers.striker.id.toString() === playerIdStr) {
        return 'Batting (Striker)';
      }
      if (currentPlayers.nonStriker && currentPlayers.nonStriker.id.toString() === playerIdStr) {
        return 'Batting (Non-Striker)';
      }
      if (currentPlayers.bowler && currentPlayers.bowler.id.toString() === playerIdStr) {
        return 'Bowling';
      }
      
      // ✅ 3. CHECK KARO: Player ne batting/bowling ki hai current innings mein?
      if (match.playersHistory && Array.isArray(match.playersHistory)) {
        const currentInningsData = match.playersHistory.find(inn => inn.innings === currentInnings);
        
        if (currentInningsData && currentInningsData.players) {
          const playerInInnings = currentInningsData.players.find(p => 
            p.playerId && p.playerId.toString() === playerIdStr
          );
          
          if (playerInInnings) {
            // Player has played in this innings but NOT out
            if (playerInInnings.balls > 0 || playerInInnings.runs > 0) {
              return 'Batting Completed (Not Out)';
            } else if (playerInInnings.overs > 0 || playerInInnings.wickets > 0 || playerInInnings.runsConceded > 0) {
              return 'Bowling Completed';
            } else {
              return 'Yet to Bat';
            }
          }
        }
      }
      
      // ✅ 4. CHECK KARO: Player ne previous innings mein khela hai?
      let hasPlayedInPreviousInnings = false;
      let wasBowler = false;
      
      if (match.playersHistory && Array.isArray(match.playersHistory)) {
        for (const innings of match.playersHistory) {
          const playerInInnings = innings.players.find(p => p.playerId && p.playerId.toString() === playerIdStr);
          if (playerInInnings) {
            hasPlayedInPreviousInnings = true;
            if (playerInInnings.overs > 0 || playerInInnings.wickets > 0 || playerInInnings.runsConceded > 0) {
              wasBowler = true;
            }
            break;
          }
        }
      }
      
      if (hasPlayedInPreviousInnings) {
        return wasBowler ? 'Bowling Completed' : 'Batting Completed (Not Out)';
      }
      
      return 'Not Played Yet';
    };

    // ✅ FUNCTION: Add status to team players - DATABASE SE STATUS USE KARO
    const addStatusToTeamPlayers = (team) => {
      if (!team || !team.players) return team;
      
      return {
        _id: team._id,
        teamName: team.teamName,
        players: team.players.map(player => ({
          name: player.name,
          _id: player._id,
          status: player.status || 'Not Playing' // ✅ Database se status use karo
        }))
      };
    };

    // ✅ CREATE TEAMS WITH STATUS FROM DATABASE
    const team1WithStatus = addStatusToTeamPlayers(match.team1);
    const team2WithStatus = addStatusToTeamPlayers(match.team2);

    // ✅ TEAM STATUS DETERMINATION
    const determineTeamStatus = () => {
      const currentInnings = match.currentInnings || 1;
      const totalInnings = match.totalInnings || 2;

      let battingTeam = null;
      let bowlingTeam = null;
      let teamStatus = {};

      if (currentInnings === 1) {
        // First innings - team1 bats first, team2 bowls
        battingTeam = team1WithStatus;
        bowlingTeam = team2WithStatus;
      } else if (currentInnings === 2) {
        // Second innings - team2 bats, team1 bowls
        battingTeam = team2WithStatus;
        bowlingTeam = team1WithStatus;
      }

      const battingStatus = `${battingTeam?.teamName} is batting`;
      const bowlingStatus = `${bowlingTeam?.teamName} is bowling`;

      // Team status setup
      teamStatus = {
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

      return teamStatus;
    };

    const teamStatus = determineTeamStatus();

    // ✅ CREATE: Player ID to name mapping - COMPREHENSIVE VERSION
    const playerNameMap = new Map();

    // Team1 ke saare players ke names add karo
    if (team1WithStatus && team1WithStatus.players) {
      team1WithStatus.players.forEach(player => {
        if (player._id) {
          playerNameMap.set(player._id.toString(), player.name);
        }
      });
    }

    // Team2 ke saare players ke names add karo
    if (team2WithStatus && team2WithStatus.players) {
      team2WithStatus.players.forEach(player => {
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

    // ✅ FUNCTION: Add names to players history
    const addNamesToPlayersHistory = (playersHistory) => {
      if (!playersHistory || !Array.isArray(playersHistory)) return playersHistory;

      return playersHistory.map(innings => ({
        ...innings,
        players: innings.players ? innings.players.map(player => ({
          ...player,
          playerName: playerNameMap.get(player.playerId?.toString()) || 'Unknown Player'
        })) : []
      }));
    };

    // ✅ FUNCTION: Add names to players array
    const addNamesToPlayersArray = (playersArray) => {
      if (!playersArray || !Array.isArray(playersArray)) return playersArray;

      return playersArray.map(player => ({
        ...player,
        playerName: playerNameMap.get(player.playerId?.toString()) || 'Unknown Player'
      }));
    };

    // MVP Leaderboard
    const mvpLeaderboard = (match.mvp || []).sort((a, b) => b.points - a.points);
    const topPerformers = mvpLeaderboard.slice(0, 3);

    // ✅ FIXED: OverHistory ko properly handle karna
    const getCompleteOverHistory = (scores) => {
      if (!scores || scores.length === 0) return [];

      const latestScore = scores[scores.length - 1];
      
      let completeOverHistory = latestScore.overHistory || [];
      
      // Agar currentOver exist karta hai aur usme balls hain
      if (latestScore.currentOver && latestScore.currentOver.balls && latestScore.currentOver.balls.length > 0) {
        const currentOverNumber = latestScore.currentOver.overNumber;
        
        // Check if this over already exists in overHistory
        const existingOverIndex = completeOverHistory.findIndex(over => over.overNumber === currentOverNumber);
        
        if (existingOverIndex !== -1) {
          // Over already exists, update its balls
          completeOverHistory[existingOverIndex] = {
            ...completeOverHistory[existingOverIndex],
            balls: latestScore.currentOver.balls
          };
        } else {
          // New over, add it to overHistory
          completeOverHistory.push({
            overNumber: currentOverNumber,
            runs: latestScore.currentOver.runs || 0,
            wickets: latestScore.currentOver.wickets || 0,
            balls: latestScore.currentOver.balls,
            _id: latestScore.currentOver._id
          });
        }
      }
      
      return completeOverHistory;
    };

    // Determine liveData - latest innings scores
    let liveData;
    if (match.scores && match.scores.length > 0) {
      const latestScore = match.scores[match.scores.length - 1];
      const currentInnings = latestScore.innings || match.scores.length;

      // Current innings ki players history find karein
      let currentInningsPlayersHistory = [];
      if (match.playersHistory && Array.isArray(match.playersHistory)) {
        const inningsData = match.playersHistory.find(inn => inn.innings === currentInnings);
        currentInningsPlayersHistory = inningsData ? inningsData.players : [];
      }

      // ✅ FIXED: Complete over history use karo
      const completeOverHistory = getCompleteOverHistory(match.scores);

      liveData = {
        innings: currentInnings,
        score: `${latestScore.runs}/${latestScore.wickets}`,
        overs: latestScore.overs,
        runRate: latestScore.runRate,
        fallOfWickets: latestScore.fallOfWickets || [],
        commentary: latestScore.commentary || [],
        overHistory: completeOverHistory,
        currentOver: latestScore.currentOver || {},
        playersHistory: addNamesToPlayersArray(currentInningsPlayersHistory),
        striker: currentPlayers.striker,
        nonStriker: currentPlayers.nonStriker,
        bowler: currentPlayers.bowler,
        battingTeam: teamStatus.battingTeam,
        bowlingTeam: teamStatus.bowlingTeam,
        battingStatus: teamStatus.battingStatus,
        bowlingStatus: teamStatus.bowlingStatus,
        lastUpdate: new Date().toISOString()
      };
    } else {
      liveData = {
        innings: 1,
        score: `${match.runs || 0}/${match.wickets || 0}`,
        overs: match.overs || 0,
        runRate: match.runRate || 0,
        fallOfWickets: match.fallOfWickets || [],
        commentary: match.commentary || [],
        overHistory: [],
        currentOver: {},
        playersHistory: [],
        striker: currentPlayers.striker,
        nonStriker: currentPlayers.nonStriker,
        bowler: currentPlayers.bowler,
        battingTeam: teamStatus.battingTeam,
        bowlingTeam: teamStatus.bowlingTeam,
        battingStatus: teamStatus.battingStatus,
        bowlingStatus: teamStatus.bowlingStatus,
        lastUpdate: new Date().toISOString()
      };
    }

    // Build innings summary from scores
    const inningsSummary = (match.scores || []).map((score, index) => {
      const inningsNumber = score.innings || index + 1;

      // Har innings ki players history find karein
      let inningsPlayersHistory = [];
      if (match.playersHistory && Array.isArray(match.playersHistory)) {
        const inningsData = match.playersHistory.find(inn => inn.innings === inningsNumber);
        inningsPlayersHistory = inningsData ? inningsData.players : [];
      }

      // ✅ FIXED: Har innings ke liye complete over history
      const inningsOverHistory = getCompleteOverHistory([score]);

      return {
        innings: inningsNumber,
        runs: score.runs,
        wickets: score.wickets,
        overs: score.overs,
        runRate: score.runRate,
        overHistory: inningsOverHistory,
        currentOver: score.currentOver || {},
        playersHistory: addNamesToPlayersArray(inningsPlayersHistory)
      };
    });

    // Overall players statistics (sabhi innings combine)
    let overallPlayersStats = [];
    if (match.playersHistory && Array.isArray(match.playersHistory)) {
      const playerMap = new Map();

      // Sabhi innings ke data ko combine karein
      match.playersHistory.forEach(innings => {
        if (innings.players && Array.isArray(innings.players)) {
          innings.players.forEach(player => {
            const playerId = player.playerId?.toString() || player.playerId;
            const playerName = playerNameMap.get(playerId) || 'Unknown Player';

            if (!playerMap.has(playerId)) {
              playerMap.set(playerId, {
                playerId: player.playerId,
                playerName: playerName,
                // Batting Stats
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                strikeRate: 0,
                // Bowling Stats  
                wickets: 0,
                overs: 0,
                runsConceded: 0,
                maidens: 0,
                economy: 0,
                wides: 0,
                noBalls: 0,
                // Common
                dismissals: "",
                isOut: false,
                inningsPlayed: 0
              });
            }

            const existingPlayer = playerMap.get(playerId);

            // Batting stats update
            existingPlayer.runs += player.runs || 0;
            existingPlayer.balls += player.balls || 0;
            existingPlayer.fours += player.fours || 0;
            existingPlayer.sixes += player.sixes || 0;

            // Bowling stats update
            existingPlayer.wickets += player.wickets || 0;
            existingPlayer.overs += player.overs || 0;
            existingPlayer.runsConceded += player.runsConceded || 0;
            existingPlayer.maidens += player.maidens || 0;
            existingPlayer.wides += player.wides || 0;
            existingPlayer.noBalls += player.noBalls || 0;

            // Dismissals and isOut
            if (player.dismissals && player.dismissals.trim() !== '') {
              existingPlayer.dismissals = player.dismissals;
            }
            if (player.isOut) {
              existingPlayer.isOut = true;
            }

            existingPlayer.inningsPlayed += 1;

            // Recalculate strike rate
            if (existingPlayer.balls > 0) {
              existingPlayer.strikeRate = parseFloat(((existingPlayer.runs / existingPlayer.balls) * 100).toFixed(2));
            }

            // Recalculate economy
            if (existingPlayer.overs > 0) {
              existingPlayer.economy = parseFloat((existingPlayer.runsConceded / existingPlayer.overs).toFixed(2));
            }
          });
        }
      });

      overallPlayersStats = Array.from(playerMap.values());
    }

    // Separate batsmen and bowlers for easy frontend use
    const batsmen = overallPlayersStats.filter(player => player.balls > 0 || player.runs > 0);
    const bowlers = overallPlayersStats.filter(player => player.overs > 0 || player.wickets > 0 || player.runsConceded > 0);

    // ✅ PlayersHistory ko bhi names ke saath prepare karein
    const playersHistoryWithNames = addNamesToPlayersHistory(match.playersHistory);

    // ✅ COMPLETE SCORECARD GENERATION - ALL PLAYERS DATA
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

        // Current innings ki players history find karo - FIXED
        let currentInningsPlayersHistory = [];
        if (match.playersHistory && Array.isArray(match.playersHistory)) {
          const inningsData = match.playersHistory.find(inn => inn.innings === inningsNumber);
          currentInningsPlayersHistory = inningsData ? inningsData.players : [];
        }

        // ✅ FIXED: Batting data - ACTUAL DATA FROM PLAYERS HISTORY
        const battingData = [];
        
        // Batting team ke saare players
        const battingTeamPlayers = inningsNumber === 1 ? team1WithStatus.players : team2WithStatus.players;
        
        battingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          
          // ✅ IMPORTANT: PlayersHistory se actual data lo
          const playerInHistory = currentInningsPlayersHistory.find(p => 
            p.playerId && p.playerId.toString() === playerIdStr
          );
          
          if (playerInHistory) {
            // Player ne batting ki hai - ACTUAL DATA USE KARO
            const isPlayerOut = playerInHistory.isOut || (playerInHistory.dismissals && playerInHistory.dismissals.trim() !== '');
            
            battingData.push({
              playerId: teamPlayer._id,
              playerName: playerName,
              runs: playerInHistory.runs || 0,
              balls: playerInHistory.balls || 0, // ✅ YEH BALLS SHOW HOGA
              fours: playerInHistory.fours || 0,
              sixes: playerInHistory.sixes || 0,
              strikeRate: playerInHistory.strikeRate || 0,
              dismissal: playerInHistory.dismissals || '',
              isNotOut: !isPlayerOut
            });
          } else {
            // Player ne batting nahi ki - basic data
            battingData.push({
              playerId: teamPlayer._id,
              playerName: playerName,
              runs: 0,
              balls: 0, // ✅ YEH BHI SHOW HOGA
              fours: 0,
              sixes: 0,
              strikeRate: 0,
              dismissal: '',
              isNotOut: true
            });
          }
        });

        // ✅ FIXED: Bowling data - ACTUAL DATA FROM PLAYERS HISTORY
        const bowlingData = [];
        
        // Bowling team ke saare players
        const bowlingTeamPlayers = inningsNumber === 1 ? team2WithStatus.players : team1WithStatus.players;
        
        bowlingTeamPlayers.forEach(teamPlayer => {
          const playerIdStr = teamPlayer._id.toString();
          const playerName = playerNameMap.get(playerIdStr) || teamPlayer.name;
          
          // ✅ IMPORTANT: PlayersHistory se actual data lo
          const playerInHistory = currentInningsPlayersHistory.find(p => 
            p.playerId && p.playerId.toString() === playerIdStr
          );
          
          if (playerInHistory && (playerInHistory.overs > 0 || playerInHistory.wickets > 0 || playerInHistory.runsConceded > 0)) {
            // Player ne bowling ki hai - ACTUAL DATA USE KARO
            
            // ✅ OVERS KO PROPER FORMAT MEIN CONVERT KARO (0.5 = 0.5, 1.2 = 1.2)
            const overs = playerInHistory.overs || 0;
            
            bowlingData.push({
              playerId: teamPlayer._id,
              playerName: playerName,
              overs: overs, // ✅ YEH OVERS SHOW HOGA
              maidens: playerInHistory.maidens || 0,
              runs: playerInHistory.runsConceded || 0,
              wickets: playerInHistory.wickets || 0,
              economy: playerInHistory.economy || 0,
              wides: playerInHistory.wides || 0,
              noBalls: playerInHistory.noBalls || 0
            });
          }
          // Player ne bowling nahi ki - skip karo (sirf bowlers dikhao)
        });

        // Extras calculate karo - FIXED: Actual extras data lo
        const extras = {
          wides: score.wides || 0,
          noBalls: score.noBalls || 0,
          byes: score.byes || 0,
          legByes: score.legByes || 0,
          penalties: score.penalties || 0
        };

        // Target and required runs for second innings
        let target = null;
        let requiredRuns = null;
        let requiredOvers = null;
        let requiredRunRate = null;

        if (inningsNumber === 2 && match.scores.length > 0) {
          const firstInningsScore = match.scores[0];
          target = (firstInningsScore.runs || 0) + 1;
          requiredRuns = Math.max(0, target - (score.runs || 0));
          requiredOvers = Math.max(0, (match.overs || 0) - (score.overs || 0));
          requiredRunRate = requiredOvers > 0 ? parseFloat((requiredRuns / requiredOvers).toFixed(2)) : 0;
        }

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
          fallOfWickets: score.fallOfWickets || [],
          ...(inningsNumber === 2 && {
            target: target,
            requiredRuns: requiredRuns,
            requiredOvers: requiredOvers,
            requiredRunRate: requiredRunRate
          })
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
        manOfTheMatch: match.manOfTheMatch || null
      };

      return {
        innings: inningsData,
        matchSummary: matchSummary
      };
    };

    const scorecard = generateScorecard();

    // Emit socket event with consistent live match data
    if (io) {
      io.emit('live-match-update', {
        matchId: id,
        liveData,
        teamStatus,
        currentPlayers,
        mvpLeaderboard,
        topPerformers
      });
    }

    // ✅ FINAL RESPONSE
    return res.status(200).json({
      success: true,
      match: {
        ...match._doc,
        team1: team1WithStatus, // ✅ Team with status from database
        team2: team2WithStatus, // ✅ Team with status from database
        scores: match.scores || [],
        inningsSummary,
        live: liveData,
        striker: currentPlayers.striker,
        nonStriker: currentPlayers.nonStriker,
        bowler: currentPlayers.bowler,
        target: match.target || null,
        mvpLeaderboard,
        topPerformers,
        playersHistory: playersHistoryWithNames || [],
        overallPlayersStats,
        batsmen,
        bowlers,
        teamStatus,
        currentPlayers,
        matchInfo: {
          venue: match.venue,
          date: match.date,
          time: match.time,
          matchType: match.matchType,
          overs: match.overs
        },
        scorecard: scorecard
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

    // ✅ 2. INNING STATUS UPDATE
    if (inningStatus) {
      match.inningStatus = inningStatus;
      
      if (inningStatus === 'innings break') {
        // First innings ka score target banao
        if (match.scores.length > 0) {
          const firstInnings = match.scores[0];
          match.target = firstInnings.runs + 1;
        }
      } else if (inningStatus === 'second innings') {
        match.currentInnings = 2;
        // Second innings initialize karo
        if (match.scores.length < 2) {
          match.scores.push({
            innings: 2,
            runs: 0,
            wickets: 0,
            overs: 0,
            runRate: 0,
            currentOver: { overNumber: 1, runs: 0, wickets: 0, balls: [] },
            overHistory: [],
            commentary: []
          });
        }
      }
      
      await match.save();
      return res.status(200).json({
        success: true,
        message: `Inning status updated to ${inningStatus}`,
        match: match
      });
    }

    // ✅ 3. BOWLER CHANGE
    if (bowler && changeBowler) {
      match.currentBowler = bowler;
      
      // Team schema mein bowler status update karo
      for (let teamId of [match.team1, match.team2]) {
        const team = await Team.findById(teamId);
        if (!team) continue;

        team.players = team.players.map((player) => {
          const playerId = player._id.toString();

          // Purane bowler ko fielding mein bhejo
          if (player.status === "Bowling") {
            return { ...player.toObject(), status: "Fielding" };
          }
          // Naye bowler ko bowling status do
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

    // ✅ 4. STRIKER CHANGE (without wicket)
    if (striker && newBatsman && !wickets) {
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

    // ✅ 5. MAIN BALL UPDATE LOGIC
    if (ballUpdate) {
      // Current innings ensure karo
      if (!match.scores[innings - 1]) {
        match.scores[innings - 1] = {
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

      const scoreData = match.scores[innings - 1];

      // PlayersHistory ensure karo
      if (!match.playersHistory.find(inn => inn.innings === innings)) {
        match.playersHistory.push({
          innings: innings,
          players: []
        });
      }

      const inningsHistory = match.playersHistory.find(inn => inn.innings === innings);
      const playersHistoryThisInnings = inningsHistory.players;

      // ✅ IMPROVED PLAYER UPDATE FUNCTION
      const updatePlayerStats = (playerId, updates) => {
        if (!playerId) return;

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

      // ✅ RUNS ADD KARO
      if (runs !== undefined) {
        scoreData.runs += ballRuns;
        match.runs = scoreData.runs;

        // Regular runs
        if (!extraType) {
          if (striker) {
            updatePlayerStats(striker, { runs: ballRuns, balls: 1 });
          }
          if (bowler) {
            updatePlayerStats(bowler, { runsConceded: ballRuns, balls: 1 });
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
              if (bowler) updatePlayerStats(bowler, { runsConceded: ballRuns, wides: 1 });
              isLegalDelivery = false;
              commentaryLine = `WIDE! ${ballRuns} run${ballRuns > 1 ? 's' : ''}`;
              break;
            case 'noball':
              if (bowler) updatePlayerStats(bowler, { runsConceded: ballRuns, noBalls: 1 });
              if (striker && ballRuns > 0) updatePlayerStats(striker, { runs: ballRuns });
              isLegalDelivery = false;
              commentaryLine = `NO BALL! ${ballRuns} run${ballRuns > 1 ? 's' : ''}`;
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

        // ✅ BOWLER KO WICKET CREDIT - Sirf jab bowler responsible ho
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

      // ✅ OVER MANAGEMENT
      // Ball data banayo
      const ballData = {
        ballNumber: scoreData.currentOver.balls.length + 1,
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
      scoreData.currentOver.runs += ballRuns;
      if (ballWicket) scoreData.currentOver.wickets += 1;

      // Over history mein bhi add karo
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
          balls: []
        };
        scoreData.overHistory.push(currentOverInHistory);
      }

      currentOverInHistory.balls.push(ballData);
      currentOverInHistory.runs += ballRuns;
      if (ballWicket) currentOverInHistory.wickets += 1;
      if (extraType === 'wide') currentOverInHistory.wides += 1;
      if (extraType === 'noball') currentOverInHistory.noBalls += 1;

      // ✅ OVERS COUNT UPDATE
      let [ov, b] = scoreData.overs.toString().split(".").map(Number);
      if (isNaN(ov)) ov = 0;
      if (isNaN(b)) b = 0;

      if (isLegalDelivery) {
        b += 1;
      }

      // ✅ OVER COMPLETE? - BOWLER OVERS UPDATE FIXED
      if (b >= 6) {
        console.log(`🎯 Over completed! Bowler: ${bowler}, Over: ${ov}.${b}`);
        
        // ✅ BOWLER KO OVER COUNT DO - FIXED
        if (bowler) {
          updatePlayerStats(bowler, { overs: 1 }); // ✅ 1 over add karo
          
          // Maiden over check karo
          if (currentOverInHistory.runs === 0) {
            updatePlayerStats(bowler, { maidens: 1 });
            console.log(`🎯 Maiden over for bowler: ${bowler}`);
          }
          
          console.log(`📊 Bowler ${bowler} overs updated to: ${playersHistoryThisInnings.find(p => p.playerId.toString() === bowler.toString())?.overs || 0}`);
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
      match.markModified('currentNonStriker');
      match.markModified('currentBowler');
      match.markModified('commentary');

      console.log(`💾 Saving match data...`);
      console.log(`📊 Final Score: ${scoreData.runs}/${scoreData.wickets} in ${scoreData.overs} overs`);
      
      // ✅ DEBUG: Check bowler stats before save
      const bowlerStats = playersHistoryThisInnings.find(p => p.playerId && p.playerId.toString() === bowler.toString());
      if (bowlerStats) {
        console.log(`🎯 Bowler Final Stats - Overs: ${bowlerStats.overs}, Runs: ${bowlerStats.runsConceded}, Wickets: ${bowlerStats.wickets}`);
      }

      // ✅ FINAL SAVE
      const savedMatch = await match.save();
      console.log(`✅ Match saved successfully!`);

      return res.status(200).json({
        success: true,
        message: "Ball updated successfully",
        match: savedMatch
      });
    }

    // ✅ 6. UNDO LAST BALL
    if (undoLastBall) {
      // Simple undo logic
      return res.status(200).json({
        success: true,
        message: "Undo feature will be implemented",
        match: match
      });
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
