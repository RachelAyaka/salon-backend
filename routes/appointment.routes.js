// routes/appointment.routes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utilities");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const Service = require("../models/service.model");
const Product = require("../models/product.model");
const moment = require("moment-timezone")

router.post("/create-appointment", authenticateToken, async (req, res) => {
  const { date, time, services, note } = req.body;
  const { user } = req.user;

  if (!date) {
    return res.status(400).json({ error: true, message: "Date is required" });
  }
  if (!time) {
    return res.status(400).json({ error: true, message: "Time is required" });
  }
  if (services.length<1) {
    return res.status(400).json({ error: true, message: "Service is required" });
  }

  try {
    // Verify service exists
    for (let i=0; i<services.length; i++) {
      const serviceExists = await Service.findById(services[i]);
      if (!serviceExists) {
        return res.status(404).json({ error: true, message: "Service not found" });
      }
    }

    // Verify product exists if provided
    // if (product) {
    //   const productExists = await Product.findById(product);
    //   if (!productExists) {
    //     return res.status(404).json({ error: true, message: "Product not found" });
    //   }
    // }

    const appointment = new Appointment({
      date,
      time,
      client: user._id,
      services,
      note: note || "",
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
      .populate({path:"services", select:"serviceName duration price"})
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
      .populate({path:"services", select:"serviceName duration price"})
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
      .populate({path:"services", select:"serviceName duration price"})
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
  const { date, time, services, note, product } = req.body;
  const { user } = req.user;

  if (!date && !time && services.length<1 && !note && product === undefined) {
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
    if (services) {
      for (let i=0; i<services.length; i++) {
        const serviceExists = await Service.findById(services[i]);
        if (!serviceExists) {
          return res.status(404).json({ error: true, message: "Service not found" });
        }
      }
      appointment.services = services;
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
    if (note !== undefined) appointment.note = note;

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

router.get("/available-slots", async (req, res) => {
  try {
    const { date, duration } = req.query;
    
    if (!date || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: "Date and duration are required" 
      });
    }
    
    // Parse the requested date
    const requestedDate = moment.tz(date, "YYYY-MM-DD", "America/Los_Angeles");
    const dayOfWeek = requestedDate.day(); // 0 is Sunday, 6 is Saturday
    const now = moment().tz('America/Los_Angeles');
    
    let startHour, endHour;
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      // Monday to Thursday
      startHour = 15; // 3pm
      endHour = 20;   // 8pm
    } else {
      // Friday, Saturday, Sunday
      startHour = 8;  // 8am
      endHour = 20;   // 8pm
    }
    
    // Set start and end time for the day in PST
    const startTime = requestedDate.clone().hour(startHour).minute(0).second(0);
    const endTime = requestedDate.clone().hour(endHour).minute(0).second(0);
    
    // Create array of all potential time slots in 15-minute increments
    const slots = [];
    const slotDuration = 15; // 15-minute slots
    let currentSlot = startTime.clone();
    
    while (currentSlot.isBefore(endTime)) {
      // Calculate the end time for this potential appointment
      const potentialEndTime = currentSlot.clone().add(parseInt(duration), 'minutes');
      
      // Only add the slot if the appointment would finish within operating hours
      if (potentialEndTime.isSameOrBefore(endTime)) {
        slots.push(currentSlot.format("h:mm A"));
      }
      
      // Move to next 15-minute slot
      currentSlot.add(slotDuration, 'minutes');
    }
    
    // Find existing appointments for the requested date
    const existingAppointments = await Appointment.find({ date })
      .populate('services', 'duration')
      .sort({ time: 1 });
    
    // Filter out unavailable slots
    const availableSlots = slots.filter(slot => {
      // Convert the slot time to moment object in PST
      const slotTime = moment.tz(`${date} ${slot}`, "YYYY-MM-DD h:mm A", "America/Los_Angeles");

      if (requestedDate.isSame(now, 'day') && slotTime.isSameOrBefore(now)) {
        return false;
      }
      
      // Calculate end time of potential appointment
      const potentialEndTime = slotTime.clone().add(parseInt(duration), 'minutes');
      
      // Check if this slot overlaps with any existing appointments
      for (const appointment of existingAppointments) {
        // Calculate total duration of services for this appointment
        let appointmentDuration = 0;
        if (appointment.services && appointment.services.length > 0) {
          appointmentDuration = appointment.services.reduce(
            (total, service) => total + (service.duration || 0), 
            0
          );
        }
        
        // Convert appointment time to moment object in PST
        const appointmentTime = moment.tz(
          `${date} ${appointment.time}`, 
          "YYYY-MM-DD h:mm A", 
          "America/Los_Angeles"
        );
        
        // Calculate end time of existing appointment
        const appointmentEndTime = appointmentTime.clone().add(appointmentDuration, 'minutes');
        
        // Check if the potential appointment overlaps with this existing appointment
        // An overlap occurs if:
        // - The potential appointment starts during an existing appointment
        // - The potential appointment ends during an existing appointment
        // - The potential appointment completely spans an existing appointment
        if (
          (slotTime.isSameOrAfter(appointmentTime) && slotTime.isBefore(appointmentEndTime)) ||
          (potentialEndTime.isAfter(appointmentTime) && potentialEndTime.isSameOrBefore(appointmentEndTime)) ||
          (slotTime.isBefore(appointmentTime) && potentialEndTime.isAfter(appointmentEndTime))
        ) {
          return false
        }
      }
      
      return true
    });
    
    // res.status(200).json({
    //   success: true,
    //   slots: availableSlots,
    //   operatingHours: {
    //     start: startTime.format("h:mm A"),
    //     end: endTime.format("h:mm A")
    //   }
    // });
    res.json({slots: availableSlots})
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while fetching available time slots" 
    });
  }
});

module.exports = router;