const mongoose = require("mongoose")
const Schema = mongoose.Schema

const serviceSchema = new Schema({
    serviceName: { type: String},
    description: { type: String},
    duration: {type: Number},
    price: {type: Number}
});
  
module.exports = mongoose.model('Service', serviceSchema);