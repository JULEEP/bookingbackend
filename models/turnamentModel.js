import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: { type: String, },
  description: String,
  startDate: { type: Date, },
  endDate: { type: Date, },
  registrationEndDate: { type: Date, },
  location: {
    lat: { type: Number, },
    lng: { type: Number,}
  },
  numberOfTeams: { type: Number, },
  format: {
    type: String,
    enum: ['T20', 'ODI', 'Test'], // ✅ You can change based on your requirement
  },
  tournamentType: {
    type: String,
    enum: ['paid', 'free'],
  },
  price: {
    type: Number,
    default: null
  },
  locationName: {
  type: String,
},
  rules: String,
  prizes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming'
  },
   teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]
}, { timestamps: true });

export const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
