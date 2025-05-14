const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    cusName: {
        type: String,
        required: true
    },
    contactNo: {
        type: Number,
        required: true
    },
    orderItem: {
        type: String,
        required: true
    },
    OrderStatus: {
        type: String,
        required: true,
    },
    dateTime: {
        type: Date,  
        required: true,
        default: Date.now 
    },
    total: {
        type: Number,  
        required: true
    }
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
