const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const FinanceOrderSchema = new Schema({
    orderId: { type: String, required: true },
    total: { type: Number, required: true },
    dateTime: { type: Date, default: Date.now}
});

const financeorder = mongoose.model("financeorder", FinanceOrderSchema);  
module.exports = financeorder;