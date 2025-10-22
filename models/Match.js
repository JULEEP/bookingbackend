import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    matchName: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    matchType: {
      type: String,
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

  overs: { type: Number, default: 0 },       // max overs
wickets: { type: Number, default: 0 },     // current wickets
maxWickets: { type: Number, default: 0 }, // ✅ ADD THIS
target: { type: Number, default: null },
totalOvers: { type: Number, default: 0 },  // or your match overs config

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
  scores: [{
    innings: Number,
    runs: Number,
    wickets: Number,
    overs: Number,
    runRate: Number,
    currentOver: {
      overNumber: Number,
      runs: Number,
      wickets: Number,
      balls: [{
        ballNumber: Number,
        runs: Number,
        wicket: Boolean,
        commentary: String,
        extraType: String,
        timestamp: Date
      }]
    },
    overHistory: [{
      overNumber: Number,
      balls: [{
        ballNumber: Number,
        runs: Number,
        wicket: Boolean,
        commentary: String,
        extraType: String,
        timestamp: Date
      }]
    }],
   fallOfWickets: [{
   player: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: String,
  runOnDelivery: Number,
  fielder: String
}],
    commentary: [String]
  }],

   playersHistory: [{
    innings: { type: Number },
    players: [{
      playerId: { type: String },
      
      // Batting Statistics
      runs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      
      // Bowling Statistics  
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      runsConceded: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      
      // Common
       dismissals: { type: String, default: "" }
    }]
  }],
   // Current players
  currentStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currentBowler: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  newBatsman: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dismissalType: { type: String },
  


    inningStatus: {
    type: String,
    enum: ['first innings', 'innings break', 'second innings', 'completed'],
    default: 'first innings'
  },
  
  currentInnings: { type: Number, default: 1 },
  totalInnings: { type: Number, default: 2 },



  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },



  ////////////////////////////////////////NEW SCHEMA//////////////////////////////////////


   // Basic match info
  team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', },
  team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', },
  matchType: { type: String, default: 'T20' },
  status: { 
    type: String, 
    default: 'upcoming' 
  },
  
  // Match timing
  startTime: { type: Date },
  endTime: { type: Date },
  
  // Current match state
  currentInnings: { type: Number, default: 1 },
  inningStatus: { 
    type: String, 
    enum: ['first innings', 'innings break', 'second innings', 'completed'],
    default: 'first innings'
  },
  target: { type: Number, default: 0 },
  
  // Current players on field
  currentStriker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentNonStriker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentBowler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Current score summary
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  overs: { type: Number, default: 0 },
  runRate: { type: Number, default: 0 },
  
  // Detailed scores per innings
  scores: [{
    innings: { type: Number, },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    runRate: { type: Number, default: 0 },
    
    // Current over details
    currentOver: {
      overNumber: { type: Number, default: 1 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      balls: [{
        ballNumber: { type: Number, },
        runs: { type: Number, default: 0 },
        wicket: { type: Boolean, default: false },
        extraType: { type: String, enum: ['wide', 'noball', 'bye', 'legbye'] },
        striker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        newBatsman: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        dismissalType: { type: String },
        commentary: { type: String },
        timestamp: { type: Date, default: Date.now }
      }]
    },
    
    // Over history
    overHistory: [{
      overNumber: { type: Number, },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      balls: [{
        ballNumber: { type: Number, },
        runs: { type: Number, default: 0 },
        wicket: { type: Boolean, default: false },
        extraType: { type: String, enum: ['wide', 'noball', 'bye', 'legbye'] },
        striker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        newBatsman: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        dismissalType: { type: String },
        commentary: { type: String },
        timestamp: { type: Date, default: Date.now }
      }]
    }],
    
    // Innings commentary
    commentary: [{ type: String }]
  }],
  
  // Players performance history - YEH IMPORTANT HAI
  playersHistory: [{
    innings: { type: Number, },
    players: [{
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },
      
      // Batting stats
      runs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      
      // Bowling stats
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      runsConceded: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      
      // Fielding/status
      dismissals: { type: String, default: "" },
      isOut: { type: Boolean, default: false }
    }]
  }],
  
  // Match commentary
  commentary: [{ type: String }],
  
  // Match result
  matchResult: {
    result: { type: String },
    winningTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    winByRuns: { type: Number },
    winByWickets: { type: Number },
    manOfTheMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String }
  },
  
  // MVP points
  mvp: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, default: 0 },
    reason: { type: String }
  }],

  playerStatuses: [
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // ya jo bhi tumhara player ka model hai
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team', // ya GameTeam, agar alag naam hai
      required: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    playerStatus: {
      type: String,
      required: true,
      enum: [
        "Batting (Striker)",
        "Batting (Non-Striker)",
        "Yet to Bat",
        "Bowling",
        "Fielding",
        "Out"
      ],
    },
  }
],

  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
