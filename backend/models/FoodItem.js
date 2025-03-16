const mongoose = require("mongoose");

const Schema = mongoose.Schema;  

const FoodItemSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

const foodItem = mongoose.model("foodItem", FoodItemSchema);  
module.exports = foodItem;
