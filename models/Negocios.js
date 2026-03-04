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
    _id: true,
    timestamps: true,
  }
);

const NegociosSchema = new mongoose.Schema(
  {
    nombre_negocio: {
      type: String,
      required: true,
      unique: true,
    },
    descripcion_negocio: {
      type: String,
      required: false,
      unique: false,
    },
    sector: {
      type: String,
      required: false,
    },
    planes: {
      type: [PlanSchema],
      required: false,
      default: [],
    },
    rfc: {
      type: String,
      required: false,
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    formularios: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Form",
        },
      ],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Negocios", NegociosSchema);
