import Ad from "../models/Ad.js";
import Admin from "../models/Admin.js";
import Banner from "../models/Banner.js";
import Booking from "../models/Booking.js";
import Category from "../models/categoryModel.js";
import Commission from "../models/Commission.js";
import Coupon from "../models/Coupon.js";
import Match from "../models/Match.js";
import PaymentIntegration from "../models/PaymentIntegration.js";
import Plan from "../models/Plan.js";
import SportsProduct from "../models/SportsProduct.js";
import Turf from "../models/Turf.js";
import User from "../models/userModel.js";




// ✅ Register Admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    const newAdmin = new Admin({ name, email, mobile, password });
    await newAdmin.save();

    return res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        mobile: newAdmin.mobile
      }
    });

  } catch (error) {
    console.error('Register Admin Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.status(200).json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile
      }
    });

  } catch (error) {
    console.error('Login Admin Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createTurf = async (req, res) => {
  try {
    const {
      name,
      pricePerHour,
      location,
      latitude,
      longitude,
      openingTime,
      closingTime,
      description,
      facilities,
      slots
    } = req.body;

    // Multer files are available in req.files (array)
    // Map filenames from uploaded files
    const images = req.files ? req.files.map(file => file.filename) : [];

    // Parse facilities
    let parsedFacilities = [];
    if (typeof facilities === "string") {
      parsedFacilities = JSON.parse(facilities);
    } else if (Array.isArray(facilities)) {
      parsedFacilities = facilities;
    }

    // Parse slots
    let parsedSlots = [];
    if (typeof slots === "string") {
      parsedSlots = JSON.parse(slots);
    } else if (Array.isArray(slots)) {
      parsedSlots = slots;
    }

    const newTurf = new Turf({
      name,
      pricePerHour,
      location,
      latitude,
      longitude,
      openingTime,
      closingTime,
      description,
      facilities: parsedFacilities,
      images,  // 👈 Save array of images
      slots: parsedSlots
    });

    await newTurf.save();

    res.status(201).json({
      success: true,
      message: "Turf created successfully",
      turf: {
        _id: newTurf._id,
        name: newTurf.name,
        pricePerHour: newTurf.pricePerHour,
        location: newTurf.location,
        latitude: newTurf.latitude,
        longitude: newTurf.longitude,
        openingTime: newTurf.openingTime,
        closingTime: newTurf.closingTime,
        description: newTurf.description,
        facilities: newTurf.facilities,
        images: newTurf.images,
        imageUrls: newTurf.images.map(img => `/uploads/turfImg/${img}`),
        slots: newTurf.slots
      }
    });
  } catch (error) {
    console.error("Error creating turf:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const getAllTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find();

    const response = turfs.map(turf => ({
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
      images: turf.images,
      imageUrls: turf.images.map(img => `/uploads/turfImg/${img}`),
      slots: turf.slots
    }));

    res.status(200).json({
      success: true,
      turfs: response
    });
  } catch (error) {
    console.error("Error fetching turfs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



// UPDATE Turf
export const updateTurf = async (req, res) => {
  const { turfId } = req.params;
  const updatedData = req.body;

  try {
    // Find the turf by ID
    const turf = await Turf.findById(turfId);

    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }

    // Update the turf with the provided data
    Object.assign(turf, updatedData);

    await turf.save();

    res.status(200).json({
      success: true,
      message: 'Turf updated successfully',
      turf
    });
  } catch (error) {
    console.error("Error updating turf:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE Turf
export const deleteTurf = async (req, res) => {
  const { turfId } = req.params;

  try {
    // Find the turf by ID
    const turf = await Turf.findById(turfId);

    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }

    // Delete the turf
    await Turf.findByIdAndDelete(turfId);

    res.status(200).json({
      success: true,
      message: 'Turf deleted successfully'
    });
  } catch (error) {
    console.error("Error deleting turf:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadBanners = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No banner images provided' });
    }

    const imagePaths = req.files.map(file => `/uploads/bannersImg/${file.filename}`);

    // Save each image as a separate banner entry (or store all in one doc if preferred)
    const banners = await Banner.insertMany(
      imagePaths.map(image => ({ image }))
    );

    res.status(201).json({
      message: 'Banners uploaded successfully',
      banners
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No new banner image provided' });
    }

    const newImagePath = `/uploads/bannersImg/${req.file.filename}`;

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { image: newImagePath, uploadedAt: new Date() },
      { new: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.status(200).json({
      message: 'Banner updated successfully',
      banner: updatedBanner,
    });
  } catch (error) {
    console.error('Banner update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Optional: Delete the image file from disk (only if needed)
    // const fs = require('fs');
    // const path = require('path');
    // const imagePath = path.join(__dirname, '..', 'public', deletedBanner.image);
    // fs.unlink(imagePath, (err) => {
    //   if (err) console.error('Failed to delete image from disk:', err);
    // });

    res.status(200).json({
      message: 'Banner deleted successfully',
      banner: deletedBanner,
    });
  } catch (error) {
    console.error('Banner delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get all banners
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ uploadedAt: -1 }); // newest first
    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


export const createMatch = async (req, res) => {
  try {
    const { title, date, time, location, status, teams, description, allowedAge, category } = req.body;

    if (category) {
      const categoryExists = await Category.findOne({ name: category });
      if (!categoryExists) {
        return res.status(400).json({ error: 'Invalid category name' });
      }
    }

    const image = req.file ? req.file.filename : null;

    const newMatch = new Match({
      title,
      date,
      time,
      location,
      status,
      description,
      allowedAge,
      teams,
      image,
      category  // Directly name store kar rahe ho
    });

    await newMatch.save();

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match: {
        ...newMatch._doc,
        imageUrl: image ? `/uploads/matchImages/${image}` : null
      }
    });

  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getAllMatches = async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {};

    if (category) {
      filter.category = category;  // category ko string ke roop mein filter kar rahe hain
    }

    const matches = await Match.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const updateBowlingStats = async (req, res) => {
  try {
    const { matchId, playerId } = req.params;
    const { overs, maidens, runs, wickets } = req.body;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    // Find match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Find bowling player by id or name
    const player = match.bowling.id(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found in bowling list' });
    }

    // Update stats
    player.overs = overs ?? player.overs;
    player.maidens = maidens ?? player.maidens;
    player.runs = runs ?? player.runs;
    player.wickets = wickets ?? player.wickets;

    // Recalculate economy = runs / overs
    player.economy = player.overs > 0 ? (player.runs / player.overs).toFixed(2) : 0;

    await match.save();

    return res.status(200).json({ message: 'Bowling stats updated', player });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



export const getMatchScorecard = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Calculate totals and stats for teams
    const teams = match.teams || [];

    // Example assuming two teams only:
    let team1 = teams[0] || {};
    let team2 = teams[1] || {};

    // Calculate runs and overs from batting array (if batting info is there)
    // If you store batting per team, you'll have to segregate that. Here is a simple example:

    const calculateTeamRunsAndBalls = (batting, teamName) => {
      // Filter batting entries for this team
      const teamBatting = batting.filter(b => b.teamName === teamName);
      let runs = 0;
      let balls = 0;

      teamBatting.forEach(player => {
        runs += player.runs || 0;
        balls += player.balls || 0;
      });

      // overs in cricket = balls/6, decimal for balls
      const overs = Math.floor(balls / 6) + (balls % 6) / 10;

      // run rate = runs / overs (avoid division by zero)
      const runRate = overs > 0 ? (runs / overs).toFixed(2) : 0;

      return { runs, balls, overs, runRate };
    };

    // If batting array exists with teamName field
    const batting = match.batting || [];

    const team1Stats = calculateTeamRunsAndBalls(batting, team1.name || '');
    const team2Stats = calculateTeamRunsAndBalls(batting, team2.name || '');

    // Target = team1's runs + 1
    const target = team1Stats.runs + 1;

    // Runs needed for team2 = target - current runs
    const runsNeeded = target - team2Stats.runs;

    return res.status(200).json({
      message: 'Match details fetched successfully',
      match: {
        id: match._id,
        title: match.title,
        date: match.date,
        time: match.time,
        location: match.location,
        status: match.status,
        description: match.description,
        allowedAge: match.allowedAge,
        category: match.category,
        teams: teams.map(team => ({
          name: team.name,
          logo: team.logo,
          coach: team.coach,
          players: team.players,
          score: team.score || 0,
        })),
        batting: match.batting,
        bowling: match.bowling,
        stats: {
          team1: {
            name: team1.name || 'Team 1',
            ...team1Stats,
          },
          team2: {
            name: team2.name || 'Team 2',
            ...team2Stats,
            runsNeeded,
            target,
          },
        },
        createdAt: match.createdAt,
        updatedAt: match.updatedAt
      }
    });
  } catch (error) {
    console.error('Get Match Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const updateBall = async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      runs = 0,
      extras = 0,
      wicket = false,
      playerOutId = null,
      bowlerId = null,
      batsmanId = null,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    // Fetch match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Get current batting and bowling teams
    const battingTeam = match.teams[match.battingTeamIndex];
    const bowlingTeam = match.teams[match.bowlingTeamIndex];

    if (!battingTeam || !bowlingTeam) {
      return res.status(400).json({ message: 'Invalid batting or bowling team index' });
    }

    // Update current over balls
    match.currentOver.balls.push({
      runs,
      extras,
      wicket,
      playerOutId: wicket ? playerOutId : null,
      bowlerId,
      batsmanId
    });

    // Update team score and extras
    battingTeam.score += runs + extras;
    battingTeam.extras += extras;

    // Update player stats - batsman
    if (batsmanId) {
      const batsman = battingTeam.players.id(batsmanId);
      if (batsman) {
        batsman.runs += runs;
        if (!extras) batsman.ballsFaced += 1;  // balls faced only if not extras
        if (wicket && playerOutId && playerOutId.toString() === batsmanId.toString()) {
          batsman.isOut = true;
          batsman.howOut = req.body.howOut || null; // optional: how out info from req
          batsman.isBatting = false;
        }
      }
    }

    // Update player stats - bowler
    if (bowlerId) {
      const bowler = bowlingTeam.players.id(bowlerId);
      if (bowler) {
        // For simplicity, no detailed bowling stats here, but can add runs conceded, balls bowled etc.
        // You can expand this as needed.
      }
    }

    // If wicket fell, increment wickets lost by batting team
    if (wicket) {
      battingTeam.wicketsLost += 1;
    }

    // Calculate overs played (balls count / 6)
    const ballsCount = match.currentOver.number * 6 + match.currentOver.balls.length;
    battingTeam.oversPlayed = Math.floor(ballsCount / 6) + (ballsCount % 6) / 10;

    // If over is complete (6 balls), increment over number, reset balls array
    if (match.currentOver.balls.length === 6) {
      match.currentOver.number += 1;
      match.currentOver.balls = [];
      // TODO: You may want to switch batting/bowling teams here if innings changes
    }

    // Save match
    await match.save();

    return res.status(200).json({
      message: 'Ball updated successfully',
      match
    });

  } catch (error) {
    console.error('Error updating ball:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getScoreboard = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Prepare scoreboard info
    const scoreboard = {
      matchTitle: match.title,
      status: match.status,
      totalOvers: match.totalOvers,
      battingTeam: null,
      bowlingTeam: null,
      currentOver: match.currentOver.number,
      currentBallsInOver: match.currentOver.balls.length,
      teams: []
    };

    // For each team, summarize score and players' key stats
    match.teams.forEach((team, idx) => {
      const teamSummary = {
        name: team.name,
        score: team.score,
        wicketsLost: team.wicketsLost,
        oversPlayed: team.oversPlayed,
        extras: team.extras,
        inningsCompleted: team.inningsCompleted,
        players: team.players.map(player => ({
          id: player._id,
          name: player.name,
          runs: player.runs,
          ballsFaced: player.ballsFaced,
          isOut: player.isOut,
          howOut: player.howOut,
          isBatting: player.isBatting,
          isBowling: player.isBowling,
          jerseyNumber: player.jerseyNumber
        }))
      };

      scoreboard.teams.push(teamSummary);

      // Mark batting and bowling teams
      if (idx === match.battingTeamIndex) {
        scoreboard.battingTeam = teamSummary;
      }
      if (idx === match.bowlingTeamIndex) {
        scoreboard.bowlingTeam = teamSummary;
      }
    });

    return res.status(200).json({ scoreboard });

  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const getAllBookingsForAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId')
      .populate('turfId')
      .populate('tournamentId');  // <-- populating tournament details too

    if (!bookings.length) {
      return res.status(404).json({ success: false, message: "No bookings found" });
    }

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching all bookings for admin:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



// Update booking status controller
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.status(200).json({ success: true, booking, message: "Booking status updated" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete booking controller
export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndDelete(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.status(200).json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



// Assign/Update role to a user
export const assignRole = async (req, res) => {
  const { userId, role } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${role} for ${user.name}`,
      user,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp'); // exclude sensitive fields if needed

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// PATCH or PUT /admin/updateuser/:id
// Patch route: /admin/updateuser/:id
export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;

    const updated = await User.findByIdAndUpdate(id, updatedFields, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user: updated });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




// DELETE /admin/deleteuser/:id
export const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching single user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const createAd = async (req, res) => {
  try {
    const { title, link } = req.body;

    if (!title || !link) {
      return res.status(400).json({ message: "Title and link are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Ad image is required" });
    }

    // Local image path
    const imageUrl = `/uploads/adsImg/${req.file.filename}`;

    const ad = new Ad({
      title,
      link,
      image: imageUrl, // save the relative path
    });

    await ad.save();

    return res.status(201).json({
      message: "Ad created successfully",
      ad,
    });
  } catch (error) {
    console.error("Create Ad Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get All Ads
export const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json({ message: "All ads fetched successfully", total: ads.length, ads });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get Single Ad
export const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateAd = async (req, res) => {
  try {
    const { title, link, status } = req.body;

    // Validate required fields
    if (!title || !link) {
      return res.status(400).json({ message: "Title and link are required" });
    }

    // Prepare updated data
    let updateData = {
      title,
      link,
      status,
    };

    // If new image is uploaded, update image path
    if (req.file) {
      updateData.image = `/uploads/adsImg/${req.file.filename}`;
    }

    const ad = await Ad.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    return res.json({
      message: "Ad updated successfully",
      ad,
    });
  } catch (error) {
    console.error("Update Ad Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
// Delete Ad
export const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json({ message: "Ad deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// ✅ Create Coupon
export const createCoupon = async (req, res) => {
  try {
    const { title, code, discount, expiryDate, categories } = req.body;
    const image = req.file ? req.file.filename : null;

    // Parse categories (from FormData JSON string)
    let parsedCategories = [];
    if (categories) {
      try {
        parsedCategories = JSON.parse(categories);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid categories format ❌",
        });
      }
    }

    // Validation
    if (!title || !code || !discount || !expiryDate) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required ❌" });
    }

    const newCoupon = new Coupon({
      title,
      code,
      discount,
      expiryDate,
      categories: parsedCategories,
      image: image ? `/uploads/couponImg/${image}` : null, // ✅ full path
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully ✅",
      coupon: {
        _id: newCoupon._id,
        title: newCoupon.title,
        code: newCoupon.code,
        discount: newCoupon.discount,
        expiryDate: newCoupon.expiryDate,
        categories: newCoupon.categories,
        image: newCoupon.image,
      },
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error ❌" });
  }
};


export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formatted = coupons.map(coupon => ({
      ...coupon._doc,
      imageUrl: coupon.image ? `${baseUrl}/uploads/couponImg/${coupon.image}` : null,
    }));

    res.json({ success: true, coupons: formatted });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,
      coupon: {
        ...coupon._doc,
        imageUrl: coupon.image ? `${baseUrl}/uploads/couponImg/${coupon.image}` : null,
      },
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const updateCoupon = async (req, res) => {
  try {
    const { title, code, discount, expiryDate, category } = req.body;
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // If new image uploaded, delete old one
    if (req.file) {
      if (coupon.image) {
        const oldPath = path.join("uploads/couponImg", coupon.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      coupon.image = req.file.filename;
    }

    // Update other fields
    coupon.title = title || coupon.title;
    coupon.code = code || coupon.code;
    coupon.discount = discount || coupon.discount;
    coupon.expiryDate = expiryDate || coupon.expiryDate;
    coupon.category = category || coupon.category;

    await coupon.save();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: {
        ...coupon._doc,
        imageUrl: coupon.image ? `${baseUrl}/uploads/couponImg/${coupon.image}` : null,
      },
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // Delete image from storage if exists
    if (coupon.image) {
      const imagePath = path.join("uploads/couponImg", coupon.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await coupon.deleteOne();

    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



// Create a new plan
export const createPlan = async (req, res) => {
  try {
    const {
      name,
      originalPrice,
      offerPrice,
      discountPercentage,
      duration,
      features,
      type,
      commissionPercentage,
      commissionAmount,
      commissionDiscount,
      couponCode,
      taxConfig,
    } = req.body;

    const newPlan = new Plan({
      name,
      originalPrice,
      offerPrice,
      discountPercentage,
      duration,
      features,
      type,
      commissionPercentage,
      commissionAmount,
      commissionDiscount,
      couponCode,
      taxConfig,
    });

    await newPlan.save();

    res
      .status(201)
      .json({ message: "Plan created successfully ✅", plan: newPlan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating plan ❌", error: error.message });
  }
};

// Get all plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json({ message: "Plans fetched successfully ✅", plans });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching plans ❌", error: error.message });
  }
};

// Update plan by ID
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPlan = await Plan.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found ❌" });
    }

    res.json({ message: "Plan updated successfully ✅", plan: updatedPlan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating plan ❌", error: error.message });
  }
};

// Delete plan by ID
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPlan = await Plan.findByIdAndDelete(id);

    if (!deletedPlan) {
      return res.status(404).json({ message: "Plan not found ❌" });
    }

    res.json({ message: "Plan deleted successfully ✅" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting plan ❌", error: error.message });
  }
};




// ✅ Create Integration
export const createIntegration = async (req, res) => {
  try {
    const integration = new PaymentIntegration(req.body);
    await integration.save();
    res.status(201).json({ message: "Integration saved successfully ✅", integration });
  } catch (error) {
    res.status(500).json({ message: "Error creating integration ❌", error });
  }
};

// ✅ Get All Integrations
export const getAllIntegrations = async (req, res) => {
  try {
    const integrations = await PaymentIntegration.find();
    res.status(200).json({ message: "All integrations fetched ✅", integrations });
  } catch (error) {
    res.status(500).json({ message: "Error fetching integrations ❌", error });
  }
};

// ✅ Get Single Integration by ID
export const getIntegrationById = async (req, res) => {
  try {
    const integration = await PaymentIntegration.findById(req.params.id);
    if (!integration) return res.status(404).json({ message: "Integration not found ❌" });
    res.status(200).json({ integration });
  } catch (error) {
    res.status(500).json({ message: "Error fetching integration ❌", error });
  }
};

// ✅ Update Integration
export const updateIntegration = async (req, res) => {
  try {
    const integration = await PaymentIntegration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!integration) return res.status(404).json({ message: "Integration not found ❌" });
    res.status(200).json({ message: "Integration updated ✅", integration });
  } catch (error) {
    res.status(500).json({ message: "Error updating integration ❌", error });
  }
};

// ✅ Delete Integration
export const deleteIntegration = async (req, res) => {
  try {
    const integration = await PaymentIntegration.findByIdAndDelete(req.params.id);
    if (!integration) return res.status(404).json({ message: "Integration not found ❌" });
    res.status(200).json({ message: "Integration deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting integration ❌", error });
  }
};



// ➕ Create Commission
export const createCommission = async (req, res) => {
  try {
    const { type, commissionPercentage, commissionAmount, commissionDiscount, couponCode } = req.body;

    if (!type || !commissionPercentage || !commissionAmount) {
      return res.status(400).json({ message: "type, commissionPercentage, and commissionAmount are required" });
    }

    const newCommission = new Commission({
      type,
      commissionPercentage,
      commissionAmount,
      commissionDiscount,
      couponCode,
    });

    await newCommission.save();

    res.status(201).json({
      message: "Commission created successfully ✅",
      commission: newCommission,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating commission ❌", error: error.message });
  }
};


// ✏️ Update Commission
export const updateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, commissionPercentage, commissionAmount, commissionDiscount, couponCode } = req.body;

    const updatedCommission = await Commission.findByIdAndUpdate(
      id,
      { type, commissionPercentage, commissionAmount, commissionDiscount, couponCode },
      { new: true } // return updated doc
    );

    if (!updatedCommission) {
      return res.status(404).json({ message: "Commission not found ❌" });
    }

    res.status(200).json({
      message: "Commission updated successfully ✅",
      commission: updatedCommission,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating commission ❌", error: error.message });
  }
};

// 🗑️ Delete Commission
export const deleteCommission = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCommission = await Commission.findByIdAndDelete(id);

    if (!deletedCommission) {
      return res.status(404).json({ message: "Commission not found ❌" });
    }

    res.status(200).json({
      message: "Commission deleted successfully ✅",
      commission: deletedCommission,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting commission ❌", error: error.message });
  }
};

// 📌 Get All Commissions
export const getAllCommissions = async (req, res) => {
  try {
    const commissions = await Commission.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "All commissions fetched ✅",
      commissions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching commissions ❌", error: error.message });
  }
};


export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      stock,
      description,
      suitableForGame,
      attributes, // This will be a plain object
    } = req.body;

    // Handle images and save the file paths
    let images = [];
    if (req.files) {
      images = req.files.map((file) => `/uploads/productImg/${file.filename}`);
    }

    // Convert the attributes object to a Map
    const attributesMap = new Map();
    Object.keys(attributes).forEach((key) => {
      // Check if the attribute is an array (e.g., sizes) and store it correctly
      if (Array.isArray(attributes[key])) {
        attributesMap.set(key, attributes[key]);
      } else {
        attributesMap.set(key, attributes[key]);
      }
    });

    // Create a new product
    const newProduct = new SportsProduct({
      name,
      category,
      price,
      stock,
      description,
      suitableForGame,
      attributes: attributesMap, // Store as Map
      images, // Save the paths to the uploaded images
    });

    await newProduct.save();
    res.status(201).json({
      message: 'Sports Product Created Successfully!',
      data: {
        ...newProduct._doc,
        imageUrls: images, // Provide the paths in the response as imageUrls
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error });
  }
};


// Get all sports products
export const getAllProducts = async (req, res) => {
  try {
    const products = await SportsProduct.find();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    res.status(200).json({
      message: 'Products fetched successfully',
      data: products.map(product => ({
        ...product._doc,
        imageUrls: product.images.map(image => `/uploads/productImg/${image.split('/').pop()}`), // Adjust the image paths
      })),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error });
  }
};