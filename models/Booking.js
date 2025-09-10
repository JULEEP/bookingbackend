import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    turfId: { type: mongoose.Schema.Types.ObjectId, ref: "Turf" },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", default: null },
    date: { type: String },
    timeSlot: { type: String },
    status: { type: String, default: "confirmed" },
    pricePerHour: { type: Number }, // To store price per hour
    subtotal: { type: Number }, // Subtotal (pricePerHour * hours)
    total: { type: Number }, // Total (subtotal + tax or any additional charges)
    teams: [
      {
        name: String,
        players: [
          {
            name: String,
            age: Number,
            position: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
