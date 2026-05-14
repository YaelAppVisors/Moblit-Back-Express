const mongoose = require('mongoose');
let Schema = mongoose.Schema;

const ClientSchema = new Schema(
    {
        clientFullName: {
            type: String,
            required: true
        },
        clientNumberPhone: {
            type: String,
            required: false
        },
        clientEmail: {
            type: String,
            required: false
        },
        clientAddress: {
            type: String,
            required: false
        },
        clientPostalCode: {
            type: String,
            required: false
        }
    },
    { 
        _id: true, 
        timestamps: true
    }
);

const HeaderSchema = new Schema(
    {
        clientData: {
            type: ClientSchema,
            required: true
        },
        ticket: { // --------> Número de referencia "Folio"
            type: String,
            required: true
        },
        productName: {
            type: String,
            required: false
        },
        serviceType: {
            type: String,
            required: true
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Negocios",
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        comments: {
            type: String,
            required: false
        },
        activo: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        _id: true,
        timestamps: true
    }
);

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

const QuestionAnwerSchema = new mongoose.Schema(
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
      enum: ['text', 'number', 'select', 'checkbox', 'date', 'radio','image', 'signature']
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
    required: { 
        type: Boolean, 
        default: false 
    },
    answer: { // -------> Aquí va la respuesta
      type: String,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true
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
      type: [QuestionAnwerSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FormSchema = new Schema(
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
        grupos: {
            type: [formGroupSchema],
            required: false,
        }
    },
    {
        _id: true,
        timestamps: true
    }
);

const StatusSchema = new Schema(
    {
        statusName: {
            type: String,
            required: true,
            enum: ['Pendiente', 'En proceso', 'Finalizado', 'Cancelado', 'Cerrado', 'Desfasado']
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        _id: true,
        timestamps: true
    }
);

const RequestSchema = new Schema({
    requestHeader: {
        type: HeaderSchema,
        required: true
    },
    requestResponse: {
        type: FormSchema,
        required: true
    },
    statusHistory: [{ // ----> Para futuras versiones de la aplicación
        type: StatusSchema,
        required: false
    }],
},
{
    timestamps: true
});

const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;