const mongoose = require('mongoose');

const FinanceBillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: String
});

module.exports = mongoose.model('FinanceBill', FinanceBillSchema);