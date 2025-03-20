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
const formGroupSchema = new mongoose.Schema(
  {
    nombre_grupo: {
      type: String,
      required: true,
      unique: true,
    },
    orden: {
      type: Number,
      required: true,
      unique: true,
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    preguntas: {
      type: [locationSchema],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Form_Group", formGroupSchema);
