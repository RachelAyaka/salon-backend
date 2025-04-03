const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../utilities");
const User = require("../models/user.model");

// Create Account
router.post("/create-account", async (req, res) => {
  const { fullName, phone, email, firstTime, minLen, maxLen, shape, password } = req.body;

  if (!fullName) {
    return res.status(400).json({ error: true, message: "Full Name is Required." });
  }
  if (!phone) {
    return res.status(400).json({ error: true, message: "Phone Number is Required." });
  }
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is Required." });
  }
  if (!password) {
    return res.status(400).json({ error: true, message: "Password is Required." });
  }

  const isUser = await User.findOne({ email: email });
  if (isUser) {
    return res.json({ error: true, message: "User already exist with the email." });
  }

  const user = new User({
    fullName,
    phone,
    email,
    firstTime,
    minLen,
    maxLen,
    shape,
    password,
  });

  await user.save();

  const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "36000m",
  });

  return res.json({
    error: false,
    user,
    accessToken,
    message: "Registration Successful",
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  const userInfo = await User.findOne({ email: email });

  if (!userInfo) {
    return res.status(400).json({ message: "User not found" });
  }

  if (userInfo.email == email && userInfo.password == password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });

    return res.json({
      error: false,
      message: "Login Successful",
      email,
      accessToken,
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Invalid Credentials",
    });
  }
});

router.get("/get-user", authenticateToken, async (req, res) => {
  const { user } = req.user;

  const isUser = await User.findOne({ _id: user._id });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({
    user: {
      _id: isUser._id,
      fullName: user.fullName,
      email: isUser.email,
      createdOn: isUser.createdOn,
    },
    message: "",
  });
});

module.exports = router;