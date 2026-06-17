const mongoose = require("mongoose");

const FolioCounterSchema = new mongoose.Schema(
  {
    modulo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negocios",
      required: false,
      default: null,
    },
    prefijo: {
      type: String,
      required: true,
      trim: true,
    },
    anio: {
      type: Number,
      required: true,
    },
    secuencia: {
      type: Number,
      required: true,
      default: 0,
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

FolioCounterSchema.index({ modulo: 1, negocio: 1, anio: 1 }, { unique: true });

module.exports = mongoose.model("FolioCounter", FolioCounterSchema);
