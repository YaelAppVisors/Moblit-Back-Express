const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    perfil: {
      type: String,
      required: true,
      default: "user",
    },
    negocio: {
      type: String,
      required: false,
    },
    location: {
      type: [locationSchema],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
