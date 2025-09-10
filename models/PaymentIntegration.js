import mongoose from "mongoose";

const paymentIntegrationSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      enum: ["Razorpay", "Stripe", "Paytm", "PhonePe"],
    },
    mode: {
      type: String,
      enum: ["test", "live"],
      default: "test",
    },
    keys: {
      apiKey: { type: String,},
      secretKey: { type: String,},
      merchantId: { type: String }, // optional
    },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentIntegration", paymentIntegrationSchema);
