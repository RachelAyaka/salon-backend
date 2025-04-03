require("dotenv").config()

const config = require("./config.json")
const mongoose = require("mongoose")

mongoose.connect(config.connectionString)

const User = require("./models/user.model")
const Note = require("./models/note.model")

const express = require("express")
const cors = require("cors")
const app = express()

app.use(express.json())

app.use(
    cors({
        origin: "*",
    })
)

app.get("/", (req, res) => {
    res.json({data: 'API is running'})
})

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

app.listen(8000)

module.exports = app