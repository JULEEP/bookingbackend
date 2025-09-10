import mongoose from 'mongoose';

const { Schema } = mongoose;

// Schema for Sports Product
const sportsProductSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
    },
    price: {
      type: Number,
    },
    stock: {
      type: Number,
    },
    description: {
      type: String,
    },
    suitableForGame: {
      type: String,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed, // allows dynamic attributes with various types
    },
    images: {
      type: [String], // URLs or paths for images
    },
  },
  { timestamps: true }
);

const SportsProduct = mongoose.model('SportsProduct', sportsProductSchema);

export default SportsProduct;
