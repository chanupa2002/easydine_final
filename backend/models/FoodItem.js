const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },

  description: { type: String },
  unitPrice: { type: Number, required: true },
  availability: { type: String, default: "Available" },
  photo: { data: Buffer, contentType: String },
});

const FoodItem = mongoose.model("FoodItem", foodItemSchema);
module.exports = FoodItem;
