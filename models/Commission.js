import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Turf", "Tournament", "Match"],
    },
    commissionPercentage: {
      type: Number,
    },
    commissionAmount: {
      type: Number,
    },
    commissionDiscount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Commission", commissionSchema);
