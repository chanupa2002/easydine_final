const express = require("express");
const fs = require("fs");
const slugify = require("slugify");
const stock = require("../models/Stock.js");
const formidable = require("express-formidable");
const financestock = require("../models/FinanceStock.js");
const mongoose = require("mongoose");
const pluralize = require("pluralize");

const { fileURLToPath } = require("url");
const path = require("path");

const router = express.Router();

router.post("/addStock", formidable(), async (req, res) => {
  try {
    let {
      name,
      category,
      description,
      measurement,
      limit,
      unitPrice,
      quantity,
    } = req.fields;
    const { photo } = req.files;

    // Normalize name: trim, lowercase, and singular form
    const normalizedName = pluralize.singular(name?.trim().toLowerCase());

    // Validate required fields
    if (
      !normalizedName ||
      !category ||
      !description ||
      !measurement ||
      !limit ||
      !unitPrice ||
      !quantity
    ) {
      return res.status(400).send({ error: "All fields are required" });
    }

    // Validate photo
    if (!photo) {
      return res.status(400).send({ error: "Photo is required" });
    }

    if (photo.size > 1000000) {
      return res.status(400).send({ error: "Photo should be less than 1MB" });
    }

    // Validate numeric values
    if (isNaN(unitPrice) || unitPrice <= 0) {
      return res
        .status(400)
        .send({ error: "Unit price must be a positive number" });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res
        .status(400)
        .send({ error: "Quantity must be a positive number" });
    }

    if (isNaN(limit) || limit <= 0) {
      return res.status(400).send({ error: "Limit must be a positive number" });
    }

    if (Number(limit) > Number(quantity)) {
      return res.status(400).send({ error: "Limit cannot exceed quantity" });
    }

    // Check for existing stock with same normalized name
    const existingStock = await stock.findOne({ name: normalizedName });
    if (existingStock) {
      return res.status(400).send({
        success: false,
        message: `Stock item "${normalizedName}" already exists`,
      });
    }

    // Calculate total cost
    const total = Number(unitPrice) * Number(quantity);

    // Create new stock item
    const stockItem = new stock({
      name: normalizedName,
      category,
      description,
      measurement,
      unitPrice: Number(unitPrice),
      quantity: Number(quantity),
      limit: Number(limit),
      total,
      slug: slugify(normalizedName),
    });

    // Attach photo data
    stockItem.photo.data = fs.readFileSync(photo.path);
    stockItem.photo.contentType = photo.type;

    // Save to DB
    const savedStock = await stockItem.save();

    // Record in finance log
    const finance = new financestock({
      stockId: savedStock._id,
      total: savedStock.total,
    });

    await finance.save();

    res.status(200).send({
      success: true,
      message: "Stock item added successfully",
      stockItem,
    });
  } catch (error) {
    console.error("Error adding stock:", error);
    res.status(500).send({ success: false, message: "Server Error", error });
  }
});


//getstock
router.get("/all", async (req, res) => {
  try {
    const items = await stock.find({});

    const formattedItems = items.map((item) => ({
      ...item._doc,
      photo: item.photo?.data
        ? `data:${item.photo.contentType};base64,${item.photo.data.toString(
            "base64"
          )}`
        : null,
    }));

    res.status(200).json({
      success: true,
      message: "Stock items retrieved successfully",
      items: formattedItems,
    });
  } catch (error) {
    console.log("Error in retrieving stock:", error);
    res.status(500).send({
      success: false,
      message: "Error in retrieving",
      error,
    });
  }
});

//update stock
router.post("/increaseStock/:id", async (req, res) => {
  try {
    const { unitPrice, quantity } = req.body;
    const stockId = req.params.id;

    // Validate quantity
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).send({
        success: false,
        message: "Invalid quantity. It must be a positive number.",
      });
    }

    // Find the stock item by ID
    const stockItem = await stock.findById(stockId);
    if (!stockItem) {
      return res.status(404).send({
        success: false,
        message: "Invalid stock ID",
      });
    }

    const currentUnitPrice = stockItem.unitPrice;
    const currentQuantity = stockItem.quantity;

    let newUnitPrice;
    let newQuantity = Number(currentQuantity) + Number(quantity);
    let total;

    if (!unitPrice) {
      // Case 1: Only quantity increases, price remains the same
      newUnitPrice = currentUnitPrice;
      total = newQuantity * currentUnitPrice;
    } else {
      // Case 2: Both quantity & price change, apply weighted average price
      if (isNaN(unitPrice) || Number(unitPrice) <= 0) {
        return res.status(400).send({
          success: false,
          message: "Invalid unit price. It must be a positive number.",
        });
      }

      const oldTotal = Number(currentQuantity) * Number(currentUnitPrice);
      const newTotal = Number(quantity) * Number(unitPrice);

      newUnitPrice = (oldTotal + newTotal) / newQuantity; // Weighted average price
      stockItem.unitPrice = newUnitPrice; // Update price in stock
      total = newQuantity * newUnitPrice; // Total value should be updated accordingly
    }

    // Update stock values
    stockItem.quantity = newQuantity;
    stockItem.total = total;
    await stockItem.save();

    // Finance should only track **expenditure** for newly added stock
    const financeStockData = new financestock({
      stockId: stockId,
      total: Number(quantity) * Number(unitPrice || currentUnitPrice), // Only new stock cost
    });
    await financeStockData.save();

    res.status(200).send({
      success: true,
      message: "Stock updated successfully",
      newQuantity: stockItem.quantity,
      newUnitPrice: stockItem.unitPrice,
      newTotal: stockItem.total,
      financeExpenditure: quantity * (unitPrice || currentUnitPrice), // Show new expenditure
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).send({
      success: false,
      message: "Error updating stock",
      error: error.message,
    });
  }
});

//low stock alerts
router.get("/lowStockAlerts", async (req, res) => {
  try {
    const lowStockItems = await stock.find({
      $expr: { $lte: ["$quantity", "$limit"] },
    });

    if (lowStockItems.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No low-stock items",
        lowStockItems: [],
      });
    }

    const alerts = lowStockItems.map(
      (item) =>
        `${item.name} is running low! Only ${item.quantity} ${item.measurement} left.`
    );

    res.status(200).send({
      success: true,
      alerts,
      lowStockItems,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error fetching low-stock alerts",
      error,
    });
  }
});

//decrease quantity
router.post("/decreaseStock", async (req, res) => {
  try {
    const { name, usedQuantity } = req.body;

    const stockItem = await stock.findOne({ name });
    if (!stockItem) {
      return res.status(404).send({
        success: false,
        message: "Stock Item not found",
      });
    }

    const limit = stockItem.limit;
    const newQuantity = Math.max(
      0,
      Number(stockItem.quantity) - Number(usedQuantity)
    );

    stockItem.quantity = newQuantity;
    await stockItem.save();

    let alertMessage = null; // To track alert messages

    // Handle low stock alert properly
    if (newQuantity <= limit) {
      console.log(
        `Alert: ${name} is running low on stock! Remaining: ${newQuantity}`
      );

      try {
        await Alert.create({
          stockName: name,
          message: `Low stock alert: Only ${newQuantity} remaining`,
          date: new Date(),
        });
        alertMessage = `Low stock alert: Only ${newQuantity} remaining`;
      } catch (alertError) {
        console.error("Error creating alert:", alertError);
      }
    }

    // Send response after all operations
    return res.status(200).send({
      success: true,
      message: "Updated successfully",
      newQuantity,
      alert: alertMessage, // Include alert message in response
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    if (!res.headersSent) {
      return res.status(500).send({
        success: false,
        message: "Error updating stock",
        error: error.message,
      });
    }
  }
});

///search  a stock Item
router.get("/searchStock", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Please provide a search term.",
      });
    }

    const searchResults = await stock
      .find({ name: { $regex: `${name}`, $options: "i" } })
      .limit(10);

    // Format the photo field into base64 if it's stored as binary data
    const formattedResults = searchResults.map((item) => ({
      ...item._doc,
      photo: item.photo?.data
        ? `data:${item.photo.contentType};base64,${item.photo.data.toString(
            "base64"
          )}`
        : null, // If no photo, set it to null
    }));

    res.status(200).send({
      success: true,
      stockItems: formattedResults,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error fetching stock items",
      error,
    });
  }
});

router.post("/filterCategory", async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || categories.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one category is required" });
    }

    const filteredStocks = await stock.find({ category: { $in: categories } });

    // Format the photo field into base64 if it's stored as binary data
    const formattedResults = filteredStocks.map((item) => ({
      ...item._doc,
      photo: item.photo?.data
        ? `data:${item.photo.contentType};base64,${item.photo.data.toString(
            "base64"
          )}`
        : null,
    }));

    res.status(200).json(formattedResults);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

// generate reports
router.post("/generate-reports", async (req, res) => {
  try {
    const { type, category } = req.body;
    if (!type) {
      return res.status(400).json({ error: "Report type is required" });
    }

    let stockData = [];

    if (type === "summary") {
      stockData = await stock
        .find({}, "name category quantity unitPrice limit")
        .lean();
      stockData = stockData.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
    } else if (type === "low-stock") {
      stockData = await stock
        .find({
          $expr: {
            $lte: [{ $toDouble: "$quantity" }, { $toDouble: "$limit" }],
          },
        })
        .lean();
        stockData = stockData.map((item) => ({
          ...item,
          total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), // Ensure valid numbers
        }));
    } else if (type === "out-of-stock") {
      stockData = await stock.find({ quantity: { $lte: 0 } }).lean();
      
    } else if (type === "valuation") {
      stockData = await stock
        .find({}, "name category quantity unitPrice")
        .lean();
      let totalStockValue = 0;

      stockData = stockData.map((item) => {
        const total = item.quantity * item.unitPrice;
        totalStockValue += total;
        return { ...item, total };
      });

      stockData.push({ name: "Total Stock Value", total: totalStockValue });
    } else if (type === "category") {
      if (!category) {
        return res
          .status(400)
          .json({ error: "Category is required for category reports" });
      }

      stockData = await stock
        .find({ category }, "name category quantity unitPrice")
        .lean();
      stockData = stockData.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
    }

    return res.status(200).json({ reportData: stockData });
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: error.message });
  }
});

//  Restrict :id to be a valid MongoDB ObjectId
router.get("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const stockId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid stock ID format" });
    }

    const stockItem = await stock.findById(stockId);
    if (!stockItem) {
      return res
        .status(404)
        .json({ success: false, message: "Stock item not found" });
    }

    res.status(200).json({
      success: true,
      unitPrice: stockItem.unitPrice,
      quantity: stockItem.quantity,
      measurement: stockItem.measurement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stock details",
      error: error.message,
    });
  }
});

//delete stock item
router.delete("/deleteItem/:id", async (req, res) => {
  try {
    const stockID = req.params.id;
    const stockItem = await stock.findById(stockID);
    if (!stockItem) {
      return res.status(404).send({
        success: false,
        message: "Stock Item is not found",
      });
    }
    if (stockItem.quantity > 0) {
      return res.status(400).send({
        success: false,
        message: "Cannot delete Stock Item.Cause quantity is not zero",
      });
    }
    await stock.findByIdAndDelete(stockID);
    res.status(200).send({
      success: true,
      message: "Stock Item deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting stock item",
      error: error.message,
    });
  }
});

module.exports = router;
