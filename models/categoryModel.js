// models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, },
    image: { type: String, default: null },
    
    // ✅ New Status Field
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
