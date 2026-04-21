const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: false,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    moneda: {
      type: String,
      required: true,
      enum: ["MXN", "USD", "EUR"],
      default: "MXN",
    },
    periodicidad: {
      type: String,
      required: true,
      enum: ["mensual", "trimestral", "semestral", "anual", "unico"],
      default: "mensual",
    },
    prueba_dias: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    beneficios: {
      type: [String],
      required: false,
      default: [],
    },
    limites: {
      usuarios: { type: Number, min: 0 },
      formularios: { type: Number, min: 0 },
      respuestas_mensuales: { type: Number, min: 0 },
    },
    licencias: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    destacado: {
      type: Boolean,
      required: true,
      default: false,
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

module.exports = mongoose.model("Plan", PlanSchema);
