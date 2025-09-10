import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
    },
    discount: {
      type: Number,
      min: 1,
      max: 100, // % discount between 1–100
    },
    expiryDate: {
      type: Date,
    },
    categories: {
      type: [String], // ✅ multiple categories
      default: [],
    },
    image: {
      type: String, // store full path `/uploads/couponImg/filename.jpg`
      default: null,
    },
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt
  }
);

export default mongoose.model("Coupon", couponSchema);
