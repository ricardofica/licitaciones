const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    credits: { type: Number, default: 0 } // Aquí se guardan las revisiones compradas
});

module.exports = mongoose.model('User', UserSchema);