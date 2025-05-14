const router = require("express").Router();
const Order = require("../models/Order");
const fs = require("fs");

const mongoose = require("mongoose");
const formidable = require("express-formidable");
const FoodItem = require("../models/FoodItem.js");
const FinanceOrder = require("../models/FinanceOrder.js");

// Add new order
router.post("/add", (req, res) => {
    try {
        const { cusName, contactNo, orderItem, OrderStatus, total } = req.body;

        const newOrder = new Order({
            cusName,
            contactNo,
            orderItem,
            OrderStatus,
            total
        });

        newOrder.save()
            .then(() => {
                res.status(201).json({ message: "Order added successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error saving order" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error adding order" });
    }
});


// Get all orders
router.get("/all", (req, res) => {
    Order.find()
        .then((orders) => {
            console.log("Fetched orders:", orders); // Add logging
            res.status(200).json(orders);
        })
        .catch((error) => {
            console.error("Detailed error:", error);
            res.status(500).json({ 
                error: "Error fetching orders",
                details: error.message 
            });
        });
});


// Update order status
router.put("/update/:id", (req, res) => {
    try {
        const { OrderStatus } = req.body;

        Order.findByIdAndUpdate(
            req.params.id,
            { OrderStatus },
            { new: true, runValidators: true }
        )
            .then((updatedOrder) => {
                if (!updatedOrder) {
                    return res.status(404).json({ message: "Order not found" });
                }
                res.status(200).json({ 
                    message: "Order status updated successfully", 
                    updatedOrder 
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error updating order status" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating order status" });
    }
});

// Delete order
router.delete("/delete/:id", (req, res) => {
    try {
        Order.findByIdAndDelete(req.params.id)
            .then((deletedOrder) => {
                if (!deletedOrder) {
                    return res.status(404).json({ message: "Order not found" });
                }
                res.status(200).json({ message: "Order deleted successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Error deleting order" });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting order" });
    }
});

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