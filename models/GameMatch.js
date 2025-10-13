import mongoose from 'mongoose';

const gameMatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameCategory',
  },
  scoringMethod: { type: String, },
  gameMode: { type: String,},
  players: [{
    type: String, // Store player names as strings
  }],
  teams: [{
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameTeam' },
  }],
  tournamentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tournament',
  }, // Optional field for tournament type
  status: { type: String, default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },  // User who created the match
    // New fields added for football match specifics
  kickOffTime: Date,
  secondHalfKickOffTime: Date,
  startedAt: Date,
  postponedAt: Date,
  cancelledAt: Date,
  endedAt: Date,

  timeElapsed: {
    type: Number,
    default: 0, // in minutes
  },

  halfTimeScore: {
    teamA: { type: Number, default: 0 },
    teamB: { type: Number, default: 0 },
  },

  extraTimeScore: {
    teamA: { type: Number, default: 0 },
    teamB: { type: Number, default: 0 },
  },

  finalScore: {
    teamA: { type: Number, default: 0 },
    teamB: { type: Number, default: 0 },
  },

  penaltyScore: {
    teamA: { type: Number, default: 0 },
    teamB: { type: Number, default: 0 },
  },
  teamScores: {
  type: Map,
  of: Number,
  default: {}
},
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('GameMatch', gameMatchSchema);
