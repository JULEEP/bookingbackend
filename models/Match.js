import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  title: { type: String },

  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },

  date: { type: String },
  time: { type: String },
  location: { type: String },
  description: { type: String },

  allowedAge: { type: String }, // e.g., "18-25"
  category: { type: String },

  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed'],
    default: 'scheduled'
  },

  totalOvers: { type: Number, default: 20 }, // match format

  // Teams array with players and live stats
  teams: [
    {
      name: { type: String },
      logo: { type: String },
      coach: { type: String },

      players: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
          name: { type: String },
          age: { type: Number },
          position: { type: String },
          jerseyNumber: { type: Number },
          height: { type: String },
          weight: { type: String },

          // Live match stats per player:
          runs: { type: Number, default: 0 },
          ballsFaced: { type: Number, default: 0 },
          isOut: { type: Boolean, default: false },
          howOut: { type: String, default: null }, // e.g. "Caught", "Bowled"
          isBatting: { type: Boolean, default: false },
          isBowling: { type: Boolean, default: false }
        }
      ],

      // Team live stats:
      score: { type: Number, default: 0 },
      wicketsLost: { type: Number, default: 0 },
      oversPlayed: { type: Number, default: 0 },  // e.g. 10.4 overs (10 overs and 4 balls)
      extras: { type: Number, default: 0 },
      inningsCompleted: { type: Boolean, default: false }
    }
  ],

  // Track which team is batting and bowling (store team index in teams array)
  battingTeamIndex: { type: Number, default: 0 },
  bowlingTeamIndex: { type: Number, default: 1 },

  // Current over info
  currentOver: {
    number: { type: Number, default: 0 }, // over number, 0 means not started yet
    balls: [
      {
        runs: { type: Number, default: 0 },
        extras: { type: Number, default: 0 }, // wides, no balls, byes etc.
        wicket: { type: Boolean, default: false },
        playerOutId: { type: mongoose.Schema.Types.ObjectId, default: null },
        bowlerId: { type: mongoose.Schema.Types.ObjectId, default: null },
        batsmanId: { type: mongoose.Schema.Types.ObjectId, default: null }
      }
    ]
  }

}, { timestamps: true });

const Match = mongoose.model('Match', matchSchema);

export default Match;
