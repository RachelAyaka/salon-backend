// routes/appointment.routes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utilities");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const Service = require("../models/service.model");
const Product = require("../models/product.model");

router.post("/create-appointment", authenticateToken, async (req, res) => {
  const { date, time, service, notes, product } = req.body;
  const { user } = req.user;

  if (!date) {
    return res.status(400).json({ error: true, message: "Date is required" });
  }
  if (!time) {
    return res.status(400).json({ error: true, message: "Time is required" });
  }
  if (!service) {
    return res.status(400).json({ error: true, message: "Service is required" });
  }

  try {
    // Verify service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({ error: true, message: "Service not found" });
    }

    // Verify product exists if provided
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(404).json({ error: true, message: "Product not found" });
      }
    }

    const appointment = new Appointment({
      date,
      time,
      client: user._id,
      service,
      notes: notes || "",
      product: product || null,
    });

    await appointment.save();

    // Add appointment to user's appointments array
    await User.findByIdAndUpdate(
      user._id,
      { $push: { appointments: appointment._id } },
      { new: true }
    );

    return res.json({
      error: false,
      appointment,
      message: "Appointment created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/get-appointments", authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("client", "fullName email phone")
      .populate("service", "serviceName duration price")
      .populate("product", "productName price")
      .sort({ date: 1, time: 1 });

    return res.json({
      error: false,
      appointments,
      message: "All appointments retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/get-appointment/:appointmentId", authenticateToken, async (req, res) => {
  const appointmentId = req.params.appointmentId;

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("client", "fullName email phone")
      .populate("service", "serviceName duration price")
      .populate("product", "productName price");

    if (!appointment) {
      return res.status(404).json({ error: true, message: "Appointment not found" });
    }

    return res.json({
      error: false,
      appointment,
      message: "Appointment retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/get-appointment-by-user/:userId", authenticateToken, async (req, res) => {
  const userId = req.params.userId;

  try {
    const appointments = await Appointment.find({ client: userId })
      .populate("service", "serviceName duration price")
      .populate("product", "productName price")
      .sort({ date: 1, time: 1 });

    return res.json({
      error: false,
      appointments,
      message: "User appointments retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.put("/edit-appointment/:appointmentId", authenticateToken, async (req, res) => {
  const appointmentId = req.params.appointmentId;
  const { date, time, service, notes, product } = req.body;
  const { user } = req.user;

  if (!date && !time && !service && !notes && product === undefined) {
    return res.status(400).json({ error: true, message: "No changes provided" });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: true, message: "Appointment not found" });
    }

    // Check if the user is the appointment owner or an admin
    if (appointment.client.toString() !== user._id.toString()) {
      return res.status(403).json({ error: true, message: "Unauthorized to edit this appointment" });
    }

    // Verify service exists if provided
    if (service) {
      const serviceExists = await Service.findById(service);
      if (!serviceExists) {
        return res.status(404).json({ error: true, message: "Service not found" });
      }
      appointment.service = service;
    }

    // Verify product exists if provided
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(404).json({ error: true, message: "Product not found" });
      }
      appointment.product = product;
    } else if (product === null) {
      // Remove product if explicitly set to null
      appointment.product = null;
    }

    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    return res.json({
      error: false,
      appointment,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.delete("/delete-appointment/:appointmentId", authenticateToken, async (req, res) => {
  const appointmentId = req.params.appointmentId;
  const { user } = req.user;

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: true, message: "Appointment not found" });
    }

    // Check if the user is the appointment owner or an admin
    if (appointment.client.toString() !== user._id.toString()) {
      return res.status(403).json({ error: true, message: "Unauthorized to delete this appointment" });
    }

    // Remove appointment from user's appointments array
    await User.findByIdAndUpdate(
      appointment.client,
      { $pull: { appointments: appointmentId } }
    );

    await Appointment.findByIdAndDelete(appointmentId);

    return res.json({
      error: false,
      message: "Appointment deleted successfully",
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