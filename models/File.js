const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  originalName: String,
  filename: String, 
  mimetype: String,
  size: Number,
  path: String,   
  url: String,
}, { timestamps: true });

module.exports = mongoose.model('File', FileSchema);