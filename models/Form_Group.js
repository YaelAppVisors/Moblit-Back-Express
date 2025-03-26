const mongoose = require("mongoose");

const optionsSchema = new mongoose.Schema(
  {
    descripcion: {
      type: String,
      required: true,
    },
    activo: {
      type: Boolean,
      required: true,
      default: true
    },
  },
  {
    timestamps: true,
  }
);

const formQuestionsSchema = new mongoose.Schema(
  {
    pregunta: {
      type: String,
      required: true,
    },
    tipo_dato: {
      type: String,
      required: true,
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    opciones: {
      type: [optionsSchema]
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
      required: true
    },
    orden: {
      type: Number,
      required: true
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    preguntas: {
      type: [formQuestionsSchema],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Form_Group", formGroupSchema);
