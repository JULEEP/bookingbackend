import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String },
    pricePerHour: { type: Number },
    location: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    openingTime: { type: String },
    closingTime: { type: String },
    description: { type: String },
    facilities: [{ type: String }],
    images: [{ type: String }], // multiple images
    slots: [
      {
        date: { type: String },
        timeSlot: { type: String },
        IsBooked: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "enabled", // ✅ Default rakha
    },
  },
  { timestamps: true }
);

const Turf = mongoose.model("Turf", turfSchema);
export default Turf;
