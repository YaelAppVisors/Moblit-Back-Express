const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    permisos: {
      type: [String],
      required: true,
      default: [],
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    sistema: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Profile", ProfileSchema);
