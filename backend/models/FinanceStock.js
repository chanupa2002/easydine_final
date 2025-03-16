const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const FinanceStockSchema = new mongoose.Schema({
    stockId: { type: String, required: true },
    total: { type: Number, required: true },
    dateTime: { type: Date, default: Date.now }
});

const financestock = mongoose.model("financestock", FinanceStockSchema);  
module.exports = financestock;