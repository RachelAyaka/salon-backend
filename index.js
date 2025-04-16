require("dotenv").config()

const mongoose = require("mongoose")

const connectionString = process.env.MONGODB_URI;
if (!connectionString) {
    console.error("MONGODB_URI not found in environment variables");
    process.exit(1);
  }

mongoose.connect(connectionString)
.then(() => {
    console.log('MongoDB connected');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
})

const express = require("express")
const cors = require("cors")
const app = express()

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
    ? 'https://salon-frontend-lilac.vercel.app' 
    : '*',
    // origin: "http://localhost:5173",
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
    ,
    
  })
)

app.use(express.json())

app.get("/", (req, res) => {
    res.json({data: 'API is running'})
})

const emailRoutes = require('./routes/email.routes')
app.use("", emailRoutes)

const userRoutes = require("./routes/user.routes")
app.use("", userRoutes)

const noteRoutes = require("./routes/note.routes");
app.use("", noteRoutes)

const appointmentRoutes = require("./routes/appointment.routes");
app.use("", appointmentRoutes)

const serviceRoutes = require("./routes/service.routes");
app.use("", serviceRoutes)

const productRoutes = require("./routes/product.routes");
app.use("", productRoutes)

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app