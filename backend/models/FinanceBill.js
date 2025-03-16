const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const FinanceBillSchema = new mongoose.Schema({
    invoiceId: { type: String, required: true },
    description: {type: String, required: true},
    total: { type: Number, required: true },
    dateTime: { type: Date, default: Date.now }
});

const financebill = mongoose.model("financebill", FinanceBillSchema);  
module.exports = financebill;