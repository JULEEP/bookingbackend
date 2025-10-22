import mongoose from 'mongoose';

const gameMatchSchema = new mongoose.Schema({
  // ✅ Basic Info
  name: { type: String },
  scoringMethod: { type: String },
  gameMode: { type: String },
  status: { type: String, default: 'pending' },
  currentStatus: { type: String, default: 'not-started' }, // e.g., 'first-half', 'full-time'

  // ✅ References
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameCategory' },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teamAId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameTeam' },
  teamBId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameTeam' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'GameTeam' },

  // ✅ Extra Meta
  refereeName: { type: String },
  stadium: { type: String },

  // ✅ Teams
  teams: [
    {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameTeam' }
    }
  ],

  // ✅ Player Names List (optional)
  players: [
    {
      type: String // Optional: store player names directly
    }
  ],


  

  // ✅ Timing
  kickOffTime: { type: Date },
  secondHalfKickOffTime: { type: Date },
  startedAt: { type: Date },
  startKickTime: { type: Date },
  postponedAt: { type: Date },
  cancelledAt: { type: Date },
  endedAt: { type: Date },
  timeElapsed: { type: Number, default: 0 },

  totalDuration: { type: Number, default: 90 },       // minutes
  halfTimeDuration: { type: Number, default: 15 },    // minutes
  extraTimeAllowed: { type: Boolean, default: false },
  extraTimeDuration: { type: Number, default: 30 },   // minutes

  extraTimeAllowedForHalfTime: { type: Boolean, default: false },
  extraTimeDurationForHalfTime: { type: Number, default: 0 },

  extraTimeAllowedForFullTime: { type: Boolean, default: false },
  extraTimeDurationForFullTime: { type: Number, default: 0 },

 // ✅ Scores
halfTimeScore: {
  teamA: { type: Number, default: 0 },
  teamB: { type: Number, default: 0 }
},
secondHalfScore: {  // 👈 New field added
  teamA: { type: Number, default: 0 },
  teamB: { type: Number, default: 0 }
},
extraTimeScore: {
  teamA: { type: Number, default: 0 },
  teamB: { type: Number, default: 0 }
},
finalScore: {
  teamA: { type: Number, default: 0 },
  teamB: { type: Number, default: 0 }
},
penaltyScore: {
  teamA: { type: Number, default: 0 },
  teamB: { type: Number, default: 0 }
},


  // ✅ Flexible Score Map
  teamScores: {
    type: Map,
    of: Number,
    default: {}
  },


   cancelReason: { type: String, default: null },

  // ✅ Scorecard with inline player data
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
          },
          warningCards: {
            yellow: { type: Number, default: 0 },
            red: { type: Number, default: 0 }
          },
            points: { type: Number, default: 0 },
          isOut: {
            type: Boolean,
            default: false
          }
        }
      ]
    }
  ],


  // Badminton specific fields
  startTime: {
    type: Date,
    default: null,
  },
  totalSets: {
    type: Number,
    default: 3,
  },
  pointsPerSet: {
    type: Number,
    default: 21,
  },
  winBy: {
    type: Number,
    default: 2,
  },
  allowDeuce: {
    type: Boolean,
    default: true,
  },
  maxDeucePoint: {
    type: Number,
    default: 30,
  },
  currentSet: {
    type: Number,
    default: 1,
  },


   // Example for sets structure (array of sets with scores)
  sets: [
    {
      setNumber: { type: Number },
      score: {
        teamA: { type: Number, default: 0 },
        teamB: { type: Number, default: 0 },
      },
      winner: { type: String, default: null },
    }
  ],
}, {
  timestamps: true
});

export default mongoose.model('GameMatch', gameMatchSchema);
