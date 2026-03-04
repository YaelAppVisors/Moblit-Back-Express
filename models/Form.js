const mongoose = require("mongoose");

const optionsSchema = new mongoose.Schema(
  {
    label: {
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

const formFieldsSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    placeholder: { type: String },
    fieldType: {
      type: String,
      required: true,
      enum: ['text', 'number', 'select', 'checkbox', 'date', 'radio']
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    opciones: {
      type: [optionsSchema],
      required: false
    },
    allowMultiOption: {
      type: Boolean,
      required: false,
      default: false
    },
    validations: {
      required: { type: Boolean, default: false },
      min: { type: Number },
      max: { type: Number },
      regex: { type: String }, 
      customMessage: { type: String }
    },
    required: { type: Boolean, default: false }
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
    fields: {
      type: [formFieldsSchema],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const formSchema = new mongoose.Schema(
  {
    nombre_formulario: {
      type: String,
      required: true,
    },
    tipo_servicio: {
      type: String,
      required: false,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negocios",
      required: true,
    },
    grupos: {
      type: [formGroupSchema],
      required: false,
    },
    configuracion_respuesta: {
      acepta_respuestas: {
        type: Boolean,
        required: true,
        default: true,
      },
      permite_anonimo: {
        type: Boolean,
        required: true,
        default: false,
      },
      una_respuesta_por_usuario: {
        type: Boolean,
        required: true,
        default: false,
      },
      fecha_inicio: {
        type: Date,
        required: false,
      },
      fecha_cierre: {
        type: Date,
        required: false,
      },
      limite_total_respuestas: {
        type: Number,
        required: false,
        min: 0,
      },
      requiere_geolocalizacion: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Form", formSchema);
