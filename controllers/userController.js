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

    // ✅ Create team with userId stored as createdBy
    const newTeam = new Team({
      teamName,
      players,
      createdBy: userId   // 👈 storing user reference
    });

    await newTeam.save();

    return res.status(201).json({
      message: "Team created successfully",
      team: newTeam
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

    // If search query provided, add case-insensitive regex filter on teamName
    if (search && search.trim() !== "") {
      query.teamName = { $regex: new RegExp(search, "i") };
    }

    const teams = await Team.find(query);

    return res.status(200).json({
      success: true,
      total: teams.length,
      message: "Teams fetched successfully",
      teams
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

    // If tournamentId is provided, validate and check if exists
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

    // Validate team1 and team2
    if (!mongoose.Types.ObjectId.isValid(team1) || !mongoose.Types.ObjectId.isValid(team2)) {
      return res.status(400).json({ message: "Invalid team ID(s)" });
    }

    const teamA = await Team.findById(team1);
    const teamB = await Team.findById(team2);
    if (!teamA || !teamB) {
      return res.status(404).json({ message: "One or both teams not found" });
    }

    // Basic validation for other fields
    if (!overs || !matchFormat || !matchType) {
      return res.status(400).json({ message: "overs, matchFormat and matchType are required" });
    }

    // Prepare match data
    const matchData = {
      team1,
      team2,
      overs,
      matchFormat,
      matchType,
      createdBy: userId,
      status: "Upcoming"
    };

    // Attach tournamentId only if provided
    if (tournament) {
      matchData.tournamentId = tournamentId;
    }

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

    // Find the match by ID and populate related fields
    const match = await Match.findById(id)
      .populate("categoryId", "name")
      .populate("tournamentId", "name")
      .populate("team1", "teamName")
      .populate("team2", "teamName")
      .populate("currentStriker", "name")
      .populate("nonStriker", "name")
      .populate("currentBowler", "name");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // MVP Leaderboard
    const mvpLeaderboard = (match.mvp || []).sort((a, b) => b.points - a.points);
    const topPerformers = mvpLeaderboard.slice(0, 3);

    // Live score data
    let liveData;
    if (match.scores && match.scores.length > 0) {
      liveData = match.scores[match.scores.length - 1];
    } else {
      liveData = {
        runs: match.runs || 0,
        wickets: match.wickets || 0,
        overs: match.overs || 0,
        runRate: match.runRate || 0,
        fallOfWickets: match.fallOfWickets || [],
        commentary: match.commentary || []
      };
    }

    // Emit live match data to all connected clients
    io.emit('live-match-update', {
      matchId: id,
      liveData, // Send the live score, wickets, overs, etc.
      mvpLeaderboard,
      topPerformers
    });

    return res.status(200).json({
      success: true,
      match: {
        ...match._doc,
        scores: match.scores || [],
        live: liveData,
        striker: match.currentStriker,
        nonStriker: match.nonStriker,
        bowler: match.currentBowler,
        mvpLeaderboard,
        topPerformers
      }
    });

  } catch (error) {
    console.error("Error fetching single match:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
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

    // Validate required fields (excluding over)
    if (
      !tossWinner || !electedTo ||
      !striker || !nonStriker ||
      !bowler || !bowlingStyle
    ) {
      return res.status(400).json({
        message: "All fields are required: tossWinner, electedTo, striker, nonStriker, bowler, bowlingStyle",
      });
    }

    // Update match details
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

    await match.save();

    // Fetch updated match
    const updatedMatch = await Match.findById(matchId)
      .populate("categoryId", "name")
      .populate("tournamentId", "name")
      .populate("teams")
      .populate("players", "name email");

    return res.status(200).json({
      success: true,
      message: "Match started successfully",
      match: updatedMatch,
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
      fallOfWicket,
      striker,
      nonStriker,
      bowler,
      extraType,
      innings = 1
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Match ID is required" });
    }

    // Find match by ID
    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // Ensure scores array exists
    if (!match.scores) match.scores = [];
    
    // Ensure current innings exists in scores array
    if (!match.scores[innings - 1]) {
      match.scores[innings - 1] = {
        runs: 0,
        wickets: 0,
        overs: 0,
        runRate: 0,
        fallOfWickets: [],
        commentary: []
      };
    }

    let scoreData = match.scores[innings - 1];
    let commentaryLine = "";

    // Runs update
    if (runs !== undefined) {
      scoreData.runs += runs;
      match.runs = scoreData.runs;
      commentaryLine = `${scoreData.overs} OVERS: Bowler to Batsman - ${runs} run${runs > 1 ? "s" : ""}.`;
    }

    // Wicket update
    if (wickets !== undefined && fallOfWicket) {
      scoreData.wickets += wickets;
      match.wickets = scoreData.wickets;

      const wicketData = {
        player: fallOfWicket.player,
        type: fallOfWicket.type,
        runOnDelivery: fallOfWicket.runOnDelivery || 0,
        fielder: fallOfWicket.fielder
      };

      scoreData.fallOfWickets.push(wicketData);
      match.fallOfWickets.push(wicketData);

      commentaryLine = `${scoreData.overs} OVERS: WICKET! ${fallOfWicket.player} is OUT. ${fallOfWicket.type.toUpperCase()}`;
      if (fallOfWicket.fielder) {
        commentaryLine += ` by ${fallOfWicket.fielder}`;
      }
      if (fallOfWicket.runOnDelivery) {
        commentaryLine += ` (${fallOfWicket.runOnDelivery} run${fallOfWicket.runOnDelivery > 1 ? "s" : ""} on that ball)`;
      }
    }

    // Extras
    if (extraType) {
      scoreData.runs += 1;
      match.runs = scoreData.runs;
      commentaryLine = `${scoreData.overs} OVERS: Bowler to Batsman - ${extraType.toUpperCase()}!`;
    }

    // Ball/Overs update
    if (ballUpdate) {
      let [over, ball] = scoreData.overs.toString().split(".").map(Number);
      if (isNaN(over)) over = 0;
      if (isNaN(ball)) ball = 0;

      ball += 1;
      if (ball >= 6) {
        over += 1;
        ball = 0;
        const overCommentary = `End of Over ${over}. Score: ${scoreData.runs}/${scoreData.wickets}`;
        scoreData.commentary.push(overCommentary);
        match.commentary.push(overCommentary);
      }
      scoreData.overs = parseFloat(`${over}.${ball}`);
      match.overs = scoreData.overs;
    }

    // Run Rate update
    if (scoreData.overs > 0) {
      let [over, ball] = scoreData.overs.toString().split(".").map(Number);
      let totalBalls = over * 6 + (ball || 0);
      scoreData.runRate = parseFloat((scoreData.runs / (totalBalls / 6)).toFixed(2));
      match.runRate = scoreData.runRate;
    }

    // Update players
    if (striker) match.currentStriker = striker;
    if (nonStriker) match.nonStriker = nonStriker;
    if (bowler) match.currentBowler = bowler;

    // Add commentary
    if (commentaryLine) {
      scoreData.commentary.push(commentaryLine);
      match.commentary.push(commentaryLine);
    }

    // Update scores array
    match.scores[innings - 1] = scoreData;

    // Save the updated match
    await match.save();

    // ✅ SOCKET.IO - Real-time update bhejo
    const liveUpdateData = {
      innings: innings,
      score: `${scoreData.runs}/${scoreData.wickets}`,
      overs: scoreData.overs,
      runRate: scoreData.runRate,
      fallOfWickets: scoreData.fallOfWickets,
      commentary: scoreData.commentary,
      striker: match.currentStriker,
      nonStriker: match.nonStriker,
      bowler: match.currentBowler,
      lastUpdate: new Date().toISOString()
    };

    // Specific match room mein broadcast karo
    io.to(id).emit('live-score-update', liveUpdateData);
    
    // Global bhi broadcast kar sakte ho agar chaho
    io.emit('match-update', {
      matchId: id,
      ...liveUpdateData
    });

    return res.status(200).json({
      success: true,
      message: "Live score updated successfully",
      match: liveUpdateData
    });

  } catch (error) {
    console.error("Error updating live score:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};