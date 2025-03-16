const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const FeedbackSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    orderId: { type: String, required: true },
    rating: {type: Number, required: true},
    feedback: { type: String, required: true }
});

const feedback = mongoose.model("feedback", FeedbackSchema);  
module.exports = feedback;