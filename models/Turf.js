import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String },
    pricePerHour: { type: Number },
    location: { type: String },
    latitude: { type: Number }, // Added
    longitude: { type: Number }, // Added
    openingTime: { type: String },
    closingTime: { type: String },
    description: { type: String },
    facilities: [{ type: String }],
    images: [{ type: String }], // Changed from single image to array of images
    slots: [
      {
        date: { type: String },
        timeSlot: { type: String },
        IsBooked: { type: Boolean, default: false }, // Added this flag
      },
    ],
  },
  { timestamps: true }
);

const Turf = mongoose.model("Turf", turfSchema);
export default Turf;
