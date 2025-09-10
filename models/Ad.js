import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
    },
    image: {
      type: String, // Cloudinary URL or local path
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ad", adSchema);
