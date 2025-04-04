const mongoose = require("mongoose")
const Schema = mongoose.Schema

const aptSchema = new Schema({
    date: {type: String},
    time: {type: String},
    client: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    services: [{type: mongoose.Schema.Types.ObjectId, ref: 'Service'}],
    note: {type: String, default: ""},
    product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product'}
})

module.exports = mongoose.model('Appointment', aptSchema);