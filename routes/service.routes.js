// routes/service.routes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utilities");
const Service = require("../models/service.model");
const Appointment = require("../models/appointment.model");

router.post("/create-service", authenticateToken, async (req, res) => {
  const { serviceName, description, duration, price } = req.body;

  if (!serviceName) {
    return res.status(400).json({ error: true, message: "Service name is required" });
  }
  if (!description) {
    return res.status(400).json({ error: true, message: "Description is required" });
  }
  if (!duration) {
    return res.status(400).json({ error: true, message: "Duration is required" });
  }
  if (!price) {
    return res.status(400).json({ error: true, message: "Price is required" });
  }

  try {
    const service = new Service({
      serviceName,
      description,
      duration,
      price,
    });

    await service.save();

    return res.json({
      error: false,
      service,
      message: "Service created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/get-services", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: 1 });

    return res.json({
      error: false,
      services,
      message: "All services retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.get("/get-service/:serviceId", async (req, res) => {
  const serviceId = req.params.serviceId;

  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: true, message: "Service not found" });
    }

    return res.json({
      error: false,
      service,
      message: "Service retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.put("/edit-service/:serviceId", authenticateToken, async (req, res) => {
  const serviceId = req.params.serviceId;
  const { serviceName, description, duration, price } = req.body;

  if (!serviceName && !description && !duration && !price) {
    return res.status(400).json({ error: true, message: "No changes provided" });
  }

  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: true, message: "Service not found" });
    }

    if (serviceName) service.serviceName = serviceName;
    if (description) service.description = description;
    if (duration) service.duration = duration;
    if (price) service.price = price;

    await service.save();

    return res.json({
      error: false,
      service,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

router.delete("/delete-service/:serviceId", authenticateToken, async (req, res) => {
  const serviceId = req.params.serviceId;

  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: true, message: "Service not found" });
    }

    // Check if service is used in any appointments
    const appointmentsWithService = await Appointment.countDocuments({ service: serviceId });
    
    if (appointmentsWithService > 0) {
      return res.status(400).json({ 
        error: true, 
        message: "Cannot delete service as it is referenced in appointments" 
      });
    }

    await Service.findByIdAndDelete(serviceId);

    return res.json({
      error: false,
      message: "Service deleted successfully",
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