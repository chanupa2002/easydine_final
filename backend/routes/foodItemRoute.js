const express = require("express");
const FoodItem = require("../models/FoodItem.js");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const fs = require("fs");

const router = express.Router();

//adding new food item
router.post("/addMenu", formidable(), async (req, res) => {
  try {
    const { name, description } = req.fields;
    const unitPrice = Number(req.fields.unitPrice); // Convert unitPrice to number
    const { photo } = req.files;

    if (!photo) {
      return res.status(400).send({ error: "Photo is required" });
    }

    if (photo.size > 1000000) {
      return res.status(400).send({ error: "Photo should be less than 1MB" });
    }

    const fooditem = new FoodItem({
      name,
      description,
      unitPrice,
    });

    // Handling file upload
    fooditem.photo.data = fs.readFileSync(photo.path);
    fooditem.photo.contentType = photo.type;

    const savedItem = await fooditem.save();
    res.status(200).send({
      success: true,
      savedItem,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ success: false, message: "Error in adding stock item", error });
  }
});

//updating food item
router.post("/updateMenu/:id", formidable(), async (req, res) => {
  try {
    const { name, availability, unitPrice, description } = req.fields;
    const { photo } = req.files;
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      return res
        .status(404)
        .send({ success: false, message: "Food item not found" });
    }

    if (name) foodItem.name = name;
    if (availability) foodItem.availability = availability;
    if (unitPrice) foodItem.unitPrice = Number(unitPrice);
    if (description) foodItem.description = description;

    if (photo) {
      if (photo.size > 1000000) {
        return res.status(400).send({ error: "Photo should be less than 1MB" });
      }
      foodItem.photo.data = fs.readFileSync(photo.path);
      foodItem.photo.contentType = photo.type;
    }

    const updatedItem = await foodItem.save();
    res.status(200).send({
      success: true,
      message: "Food item updated successfully",
      updatedItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error updating food item",
      error,
    });
  }
});

// Get all food items including photos
router.get("/menu", async (req, res) => {
  try {
    const foodItems = await FoodItem.find();

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
        : null, // Convert photo binary data to Base64
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

router.get("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Find the food item in the database by its ID
    const foodItem = await FoodItem.findById(id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    // Return the found food item with a success message
    res.status(200).json({
      success: true,
      foodItem: {
        name: foodItem.name,
        availability: foodItem.availability,
        unitPrice: foodItem.unitPrice,
        description: foodItem.description,
        photo: foodItem.photo
          ? `data:${
              foodItem.photo.contentType
            };base64,${foodItem.photo.data.toString("base64")}`
          : null, // If photo exists, return it as base64
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching food item",
      error: error.message,
    });
  }
});

router.delete("/delete-food/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid food item ID",
      });
    }

    // Delete the food item
    const deletedItem = await FoodItem.findByIdAndDelete(id);

    // If item does not exist
    if (!deletedItem) {
      return res.status(404).send({
        success: false,
        message: "Food item not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Food Item deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send({
      success: false,
      message: "Error while deleting",
      error: error.message,
    });
  }
});

//generate reports
router.get("/reports", async (req, res) => {
  const { reportType } = req.query;
  console.log(reportType);
  // Getting report type from query parameter

  try {
    let reportData;

    switch (reportType) {
      case "menuOverview":
        // Menu Overview Report
        reportData = await FoodItem.find({});
        res.json(reportData);
        break;

      case "availability":
        // Food Item Availability Report
        const availabilityData = await FoodItem.find({});
        const availabilityReport = availabilityData.map((item) => ({
          name: item.name,
          availability: item.availability,
        }));
        res.json(availabilityReport);
        break;

      case "priceAnalysis":
        // Price Analysis Report
        const foodItems = await FoodItem.find({});
        const prices = foodItems.map((item) => item.unitPrice);
        const totalPrice = prices.reduce((acc, price) => acc + price, 0);
        const averagePrice = totalPrice / prices.length;
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        res.json({
          averagePrice,
          maxPrice,
          minPrice,
          priceRange: maxPrice - minPrice,
        });
        break;

      default:
        res.status(400).send("Invalid report type");
    }
  } catch (err) {
    res.status(500).send("Error generating report");
  }
});

router.get("/search-menu", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).send({
        success: false,
        message: "Search query is required",
      });
    }

    // Perform case-insensitive search
    const foodItems = await FoodItem.find({
      name: { $regex: query, $options: "i" },
    });

    if (!foodItems.length) {
      return res.status(404).send({
        success: false,
        message: "No matching food items found",
      });
    }

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
      message: "Error searching food items",
      error: error.message,
    });
  }
});

module.exports = router;