import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
  },
 players: [
  {
    name: {
      type: String,
    },
    role: {
      type: String,
    },
    subRole: {
      type: String,
    },
    designation: {
      type: String,
    }
  }
],
 teamName: {
    type: String,
    trim: true
  },
  players: [
    {
      name: {
        type: String,
        trim: true
      },
      // Agar aap player ke aur details chahte ho (e.g. age, position etc.), woh bhi yahan add ho sakte hain
    }
  ],
  createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},
}, {
  timestamps: true
});

export default mongoose.model("Team", teamSchema);
