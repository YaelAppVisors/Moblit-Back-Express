const mongoose = require("mongoose");

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
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: false,
      default: null,
    },
    rfc: {
      type: String,
      required: false,
    },
    desfase_bajo_horas: {
      type: Number,
      required: false,
      default: 1,
      min: 0,
    },
    desfase_bajo_color: {
      type: String,
      required: false,
      default: "#22c55e",
    },
    desfase_medio_horas: {
      type: Number,
      required: false,
      default: 3,
      min: 0,
    },
    desfase_medio_color: {
      type: String,
      required: false,
      default: "#f59e0b",
    },
    desfase_alto_horas: {
      type: Number,
      required: false,
      default: 6,
      min: 0,
    },
    desfase_alto_color: {
      type: String,
      required: false,
      default: "#ef4444",
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
