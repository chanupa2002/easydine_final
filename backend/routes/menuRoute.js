const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const fs = require("fs");

const FoodItem = require("../models/FoodItem.js");
const Order = require("../models/order.js");
const FinanceOrder = require("../models/FinanceOrder.js");

const router = express.Router();

// Middleware
router.use(express.json());

// Get all menu items for customer
router.get("/menu", async (req, res) => {
  try {
    const foodItems = await FoodItem.find({ availability: "Available" });

    const formattedItems = foodItems.map((item) => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      unitPrice: item.unitPrice,
      availability: item.availability,
      photo: item.photo
        ? `data:${item.photo.contentType};base64,${item.photo.data.toString(
            "base64"
          )}`
        : null,
    }));

    res.status(200).send({
      success: true,
      count: formattedItems.length,
      foodItems: formattedItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error retrieving menu items",
      error,
    });
  }
});

// Place an order
router.post("/placeorder", async (req, res) => {
  console.log("Received order data:", req.body);
  const { items, totalPrice, cusName, contactNo, orderStatus, dateTime } =
    req.body;

  try {
    const itemString = items
      .map((item) => `${item.name} x${item.quantity}`)
      .join(", ");

    const order = new Order({
      cusName,
      contactNo,
      orderItem: itemString,
      total: totalPrice,
      OrderStatus: orderStatus,
      dateTime,
    });

    await order.save();
    res.status(200).json({ success: true, orderId: order._id });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

// Handle online payment and finance order
router.post("/onlinepayment", async (req, res) => {
  try {
    const { cusName, contactNo, items, totalPrice, paymentDetails } = req.body;

    const formattedOrderItems = items
      .map((item) => `${item.name} x${item.quantity}`)
      .join(", ");

    const newOrder = new Order({
      cusName,
      contactNo,
      orderItem: formattedOrderItems,
      OrderStatus: "Paid",
      total: totalPrice,
    });

    const savedOrder = await newOrder.save();

    const newFinanceOrder = new FinanceOrder({
      orderId: savedOrder._id.toString(),
      total: totalPrice,
    });

    await newFinanceOrder.save();

    res
      .status(200)
      .json({ success: true, message: "Payment successful and order saved.",orderID: savedOrder._id });
  } catch (error) {
    console.error("Error processing payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment processing failed." });
  }
});

module.exports = router;
