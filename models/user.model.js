const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    fullName: {type: String},
    phone: {type: String},
    email: {type: String},
    firstTime: {type: Boolean, default:false},
    minLen: {type: Number, default: 0},
    maxLen: {type: Number, default: 0},
    shape: {type: String, default: ''},
    appointments:[{type: mongoose.Schema.Types.ObjectId, ref: "Appointment"}],
    note: {type: String, default: ''},
    password: {type: String},
    createdOn: {type: Date, default: new Date().getTime()},
})

module.exports = mongoose.model("User", userSchema)