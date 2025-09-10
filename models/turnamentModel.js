import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  location: { type: String },
  price: { type: Number },
  image: { type: String, default: null },
  details: {
    date: { type: String },          // ya Date type agar chaho
    time: { type: String },          // e.g., "09 AM - 12 PM"
    allowedAge: { type: String },    // e.g., "16-24"
    slots: [
      {
        timeSlot: { type: String, required: true },
        isBooked: { type: Boolean, default: false }
      }
    ]
  }
}, { timestamps: true });

export const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
