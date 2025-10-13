import mongoose from "mongoose";

const gameCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"]
    }
  },
  { timestamps: true }
);

export default mongoose.model("GameCategory", gameCategorySchema);
