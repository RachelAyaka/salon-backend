const mongoose = require("mongoose")
const Schema = mongoose.Schema

const productSchema = new Schema({
    productName: {type: String},
    description: {type: String},
    price: {type: Number},
})

module.exports = mongoose.model("Product", productSchema)