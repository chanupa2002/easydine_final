const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const StockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  unitPrice: { type: Number, required: true },
  measurement: { type: String, required: true },
  quantity: { type: Number, required: true },
  limit: { type: Number, required: true },
  total: { type: Number, required: true },
  photo: { data: Buffer, contentType: String },
});

const stock = mongoose.model("stock", StockSchema);
module.exports = stock;

