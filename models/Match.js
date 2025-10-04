import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    matchName: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    matchType: {
      type: String,
      enum: ["T20", "ODI", "Test", "Friendly", "League", "Knockout"],
    },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
    schedule: {
      date: String,
      time: String,
      dateTime: Date,
    },
      over: {
    type: Number,
    default: 0,
  },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Scheduled", "Live", "Completed", "Cancelled", "Postponed", "Upcoming"],
      default: "Scheduled",
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    resultSummary: { type: String, default: "" },

    // New fields
    maxParticipants: { type: Number, default: 0 },
    location: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0 },
    description: { type: String, trim: true, default: "" },
     // **Add matchMode here**
    matchMode: {
      type: String,
      enum: ["Team", "Individual", "Group"],
    },
    toss: {
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  elected: { type: String, enum: ["Bat", "Bowl"] }
},
opening: {
  striker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
},
bowling: {
  bowler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  style: { type: String }
},

 team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  matchFormat: {
    type: String,
  },
  matchType: {
    type: String,
  },
  status: {
    type: String,
    default: "Upcoming"
  },
  overs: { type: Number, default: 0 },        // e.g. 1.2 overs
  runs: { type: Number, default: 0 },         // total runs
  wickets: { type: Number, default: 0 },      // total wickets
  runRate: { type: Number, default: 0 },      // runs per over
  fallOfWickets: [
    {
      score: String,                          // e.g. "10/1"
      player: String,                         // "Player A1"
      over: String                            // "1.2 ov"
    }
  ],
  currentStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currentBowler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  commentary: { type: [String], default: [] },
   mvp: [
    {
      player: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
      points: { type: Number, default: 0 }
    }
  ],

    // Scores array for multiple innings
  scores: [
    {
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      runRate: { type: Number, default: 0 },
      fallOfWickets: [
        {
          player: String,
          type: String,
          fielder: String,
          runOnDelivery: Number
        }
      ],
      commentary: [String]
    }
  ],


   // Current players
  currentStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currentBowler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },



  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
