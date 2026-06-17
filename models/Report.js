const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: ["request", "hallazgo", "negocio", "admin"],
    },
    folio: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    generadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negocios",
      required: false,
      default: null,
    },
    filtros: {
      type: Object,
      required: false,
      default: {},
    },
    resumen: {
      type: Object,
      required: true,
      default: {},
    },
    detalle: {
      type: Object,
      required: false,
      default: {},
    },
    estatus: {
      type: String,
      required: true,
      enum: ["generado", "fallido"],
      default: "generado",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", ReportSchema);
