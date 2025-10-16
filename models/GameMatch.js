import mongoose from 'mongoose';

const gameMatchSchema = new mongoose.Schema({
  name: { type: String, },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameCategory',
  },

  scoringMethod: { type: String },
  gameMode: { type: String },

  players: [{
    type: String, // Store player names as strings
  }],

  teams: [{
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameTeam' },
  }],

  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
  },

  status: { type: String, default: 'pending' },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // ⚽ Football-specific fields
  teamAId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameTeam',
  },
  teamBId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameTeam',
  },

  refereeName: { type: String },
  stadium: { type: String },

  kickOffTime: { type: Date },
  secondHalfKickOffTime: { type: Date },
  startedAt: { type: Date },
  postponedAt: { type: Date },
  cancelledAt: { type: Date },
  endedAt: { type: Date },

  totalDuration: { type: Number, default: 90 }, // in minutes
  halfTimeDuration: { type: Number, default: 15 },
  extraTimeAllowed: { type: Boolean, default: false },
  extraTimeDuration: { type: Number, default: 30 }, // if extra time is allowed

  timeElapsed: { type: Number, default: 0 }, // in minutes

  // 🧮 Scores
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

  // Optional: store all scores in a flexible structure
  teamScores: {
    type: Map,
    of: Number,
    default: {},
  },


    startedAt: Date,
  startKickTime: Date,

  scoreCard: [
    {
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameTeam'
      },
      teamName: String,
      teamGoals: {
        type: Number,
        default: 0
      },
      players: [
        {
          playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' // or 'Player'
          },
          playerName: String,
          goals: {
            type: Number,
            default: 0
          }
        }
      ]
    }
  ],

  winner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'GameTeam'
},


 startKickTime: { type: Date },
  totalDuration: { type: Number },         // in minutes
  halfTimeDuration: { type: Number },      // in minutes
  extraTimeAllowed: { type: Boolean },
  extraTimeDuration: { type: Number },     // in minutes

  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

export default mongoose.model('GameMatch', gameMatchSchema);
