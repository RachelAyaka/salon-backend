// routes/product.routes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utilities");
const Product = require("../models/product.model");
const Appointment = require("../models/appointment.model");

router.post("/create-product", authenticateToken, async (req, res) => {
  const { productName, description, price } = req.body;

  if (!productName) {
    return res.status(400).json({ error: true, message: "Product name is required" });
  }
  if (!description) {
    return res.status(400).json({ error: true, message: "Description is required" });
  }
  if (!price) {
    return res.status(400).json({ error: true, message: "Price is required" });
  }

  try {
    const product = new Product({
      productName,
      description,
      price,
    });

    await product.save();

    return res.json({
      error: false,
      product,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/get-products", async (req, res) => {
  try {
    const products = await Product.find().sort({ productName: 1 });

    return res.json({
      error: false,
      products,
      message: "All products retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/get-product/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: true, message: "Product not found" });
    }

    return res.json({
      error: false,
      product,
      message: "Product retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.put("/edit-product/:productId", authenticateToken, async (req, res) => {
  const productId = req.params.productId;
  const { productName, description, price } = req.body;

  if (!productName && !description && !price) {
    return res.status(400).json({ error: true, message: "No changes provided" });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: true, message: "Product not found" });
    }

    if (productName) product.productName = productName;
    if (description) product.description = description;
    if (price) product.price = price;

    await product.save();

    return res.json({
      error: false,
      product,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.delete("/delete-product/:productId", authenticateToken, async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: true, message: "Product not found" });
    }

    // Check if product is used in any appointments
    const appointmentsWithProduct = await Appointment.countDocuments({ product: productId });
    
    if (appointmentsWithProduct > 0) {
      return res.status(400).json({ 
        error: true, 
        message: "Cannot delete product as it is referenced in appointments" 
      });
    }

    await Product.findByIdAndDelete(productId);

    return res.json({
      error: false,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

module.exports = router;