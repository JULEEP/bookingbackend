import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    // 🔹 Basic Plan Fields
    name: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    discountPercentage: { type: Number },
    duration: { type: String, required: true }, // Example: "3 Months"
    features: [{ type: String }],

    // 🔥 Commission Fields
    type: { type: String }, // "fixed" / "percentage"
    commissionPercentage: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    commissionDiscount: { type: Number, default: 0 },
    couponCode: { type: String },

    // 💰 Tax Configurations (Array of Objects)
    taxConfig: [
      {
        country: { type: String },
        state: { type: String },
        taxCode: { type: String },
        taxRate: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
