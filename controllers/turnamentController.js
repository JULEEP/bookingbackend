import Tournament from "../models/turnamentModel.js";
import Category from "../models/categoryModel.js"
import mongoose from "mongoose";



export const createTournament = async (req, res) => {
  try {
    const {
      name,
      location,
      price,
      description,
      date,
      time,
      allowedAge,
      slots,
      status // optional input
    } = req.body;

    const image = req.file ? req.file.filename : null;

    // Validate and process slots
    let processedSlots = [];
    if (slots && Array.isArray(slots)) {
      processedSlots = slots.map(slot => ({
        timeSlot: slot.timeSlot,
        isBooked: false
      }));
    }

    const newTournament = new Tournament({
      name,
      location,
      price,
      description,
      details: {
        date,
        time,
        allowedAge,
        slots: processedSlots
      },
      image,
      status: status || 'enabled' // default to 'enabled' if not provided
    });

    await newTournament.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament: {
        _id: newTournament._id,
        name: newTournament.name,
        description: newTournament.description,
        location: newTournament.location,
        price: newTournament.price,
        details: {
          date: newTournament.details.date,
          time: newTournament.details.time,
          allowedAge: newTournament.details.allowedAge,
          slots: newTournament.details.slots
        },
        image: newTournament.image,
        imageUrl: image ? `/uploads/tournamentImg/${image}` : null,
        status: newTournament.status
      }
    });

  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




export const updateTournament = async (req, res) => {
  try {
    const {
      name,
      location,
      price,
      description,
      date,
      time,
      allowedAge,
      slots,
      status // ← added status from req.body
    } = req.body;

    const tournamentId = req.params.id;

    // Validate and process slots
    let processedSlots = [];
    if (slots && Array.isArray(slots)) {
      processedSlots = slots.map(slot => ({
        timeSlot: slot.timeSlot,
        isBooked: slot.isBooked || false,
      }));
    }

    const updateData = {
      name,
      location,
      price,
      description,
      details: {
        date,
        time,
        allowedAge,
        slots: processedSlots,
      },
    };

    // Add status to updateData if provided
    if (status) {
      updateData.status = status;
    }

    // Handle image update if new file uploaded
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(tournamentId, updateData, {
      new: true, // Return the updated document
    });

    if (!updatedTournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully',
      tournament: {
        _id: updatedTournament._id,
        name: updatedTournament.name,
        description: updatedTournament.description,
        location: updatedTournament.location,
        price: updatedTournament.price,
        details: {
          date: updatedTournament.details.date,
          time: updatedTournament.details.time,
          allowedAge: updatedTournament.details.allowedAge,
          slots: updatedTournament.details.slots,
        },
        image: updatedTournament.image,
        imageUrl: updatedTournament.image ? `/uploads/tournamentImg/${updatedTournament.image}` : null,
        status: updatedTournament.status
      },
    });

  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




export const deleteTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;

    const tournament = await Tournament.findByIdAndDelete(tournamentId);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Optional: If you have images saved in a directory, you may want to delete the file as well
    if (tournament.image) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '..', 'uploads', 'tournamentImg', tournament.image);

      // Delete the image file if it exists
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




export const getAllTournaments = async (req, res) => {
  try {
    const categoryQuery = req.query.category;
    let filter = {};

    if (categoryQuery) {
      // Match category query with 'name' field of tournament (case-insensitive)
      filter.name = { $regex: new RegExp(categoryQuery, 'i') };
    }

    // Apply filter and sort by details.date descending (most recent first)
    const tournaments = await Tournament.find(filter).sort({ 'details.date': -1 });

    // Map tournaments and include nested details and imageUrl, including slots if available
    const tournamentsWithImageUrl = tournaments.map(t => ({
      _id: t._id,
      name: t.name,
      description: t.description,
      location: t.location,
      price: t.price,
      status: t.status,
      details: {
        date: t.details.date,
        time: t.details.time,
        allowedAge: t.details.allowedAge,
        slots: t.details.slots || [],  // Include slots array or empty if none
      },
      image: t.image ? `/uploads/tournamentImg/${t.image}` : null,
    }));

    res.status(200).json({
      success: true,
      tournaments: tournamentsWithImageUrl,
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};


export const getSingleTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Tournament fetched successfully',
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        description: tournament.description,
        location: tournament.location,
        price: tournament.price,
        details: {
          date: tournament.details.date,
          time: tournament.details.time,
          allowedAge: tournament.details.allowedAge,
          slots: tournament.details.slots || [],  // Include slots array or empty if none
        },
        image: tournament.image ? `/uploads/tournamentImg/${tournament.image}` : null
      }
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


export const getUpcomingTournament = async (req, res) => {
  try {
    const now = new Date();
    // Set time part of now to 00:00:00 so we compare only date
    now.setHours(0, 0, 0, 0);

    const categoryQuery = req.query.category;

    let filter = {};

    if (categoryQuery) {
      // If you want to filter by category (assuming category stored in name field or add accordingly)
      filter.name = { $regex: new RegExp(categoryQuery, 'i') };
    }

    // Fetch all tournaments matching filter
    const allTournaments = await Tournament.find(filter);

    // Filter tournaments whose details.date is today or later
    const upcoming = allTournaments
      .filter(t => {
        if (!t.details || !t.details.date) return false; // skip if no date
        const tournamentDate = new Date(t.details.date);
        tournamentDate.setHours(0, 0, 0, 0); // ignore time part
        return tournamentDate >= now;
      })
      .sort((a, b) => new Date(a.details.date) - new Date(b.details.date));

    if (upcoming.length === 0) {
      return res.status(404).json({ success: false, message: 'No upcoming tournaments found' });
    }

    const tournament = upcoming[0];

    const tournamentWithImageUrl = {
      _id: tournament._id,
      name: tournament.name,
      description: tournament.description,
      location: tournament.location,
      price: tournament.price,
      details: {
        date: tournament.details.date,
        time: tournament.details.time,
        allowedAge: tournament.details.allowedAge,
        slots: tournament.details.slots || [],
      },
      image: tournament.image ? `/uploads/tournamentImg/${tournament.image}` : null,
    };

    res.status(200).json({
      success: true,
      tournament: tournamentWithImageUrl,
    });
  } catch (error) {
    console.error('Error fetching upcoming tournament:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



export const getTournamentTeams = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ message: "Invalid tournamentId" });
    }

    const tournament = await Tournament.findById(tournamentId)
      .populate({
        path: "teams",
        select: "teamName categoryId tournamentId players createdAt updatedAt",
        populate: {
          path: "players",
          select: "name role subRole designation", // assuming you added subRole & designation fields
        }
      })
      .lean();

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    return res.status(200).json({
      success: true,
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        date: tournament.date,
        timeSlot: tournament.timeSlot,
        price: tournament.price,
        image: tournament.image,
        details: tournament.details,
        teams: tournament.teams,  // populated with full team details
        updatedAt: tournament.updatedAt
      }
    });

  } catch (error) {
    console.error("Error fetching tournament teams:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};