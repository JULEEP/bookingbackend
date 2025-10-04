import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
  filePath: {
    type: String,
    default: null,
  },
  recipients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
