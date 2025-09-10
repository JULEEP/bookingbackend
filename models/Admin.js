import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true
  },
  mobile: {
    type: String,
    trim: true
  },
  password: {
    type: String,
  }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);
