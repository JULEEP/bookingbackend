import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  mobile: { type: String, unique: true },
  password: { type: String },
  otp: { type: String, default: null },
  city: { type: String },
  gender: { type: String },
  dob: { type: Date },
  latitude: { type: Number },
  longitude: { type: Number },
  
  profileImage: {
    type: String, // store image path or URL here
    default: '',  // optional default value
  },

  notifications: [{ type: String }],  // Simple array of string messages

  myTeams: [
    {
      teamId: mongoose.Schema.Types.ObjectId,
      matchId: mongoose.Schema.Types.ObjectId,
      teamName: String,
      players: [
        {
          name: String,
          age: Number,
          position: String,
          jerseyNumber: Number,
          height: String,
          weight: String
        }
      ],
      createdAt: Date
    }
  ],

  // ✅ New Role Field
  role: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Ground Admin', 'Turf Admin', 'Match Admin', 'User'],
    default: 'User'
  }

}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
