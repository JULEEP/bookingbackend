import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  teamName: { type: String },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameCategory',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
    }
  }]
}, { timestamps: true });

export default mongoose.model('GameTeam', teamSchema);
