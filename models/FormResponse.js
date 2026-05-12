const mongoose = require("mongoose");

const selectedOptionSchema = new mongoose.Schema(
  {
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const answerSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    fieldName: {
      type: String,
      required: true,
      trim: true,
    },
    fieldLabel: {
      type: String,
      required: true,
      trim: true,
    },
    fieldType: {
      type: String,
      required: true,
      enum: ["text", "number", "select", "checkbox", "date", "radio",'image', 'signature'],
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      validate: {
        validator: function validateValueByType(currentValue) {
          if (currentValue === undefined || currentValue === null) return true;

          if (this.fieldType === "text") return typeof currentValue === "string";
          if (this.fieldType === "number") return typeof currentValue === "number" && !Number.isNaN(currentValue);
          if (this.fieldType === "date") {
            if (currentValue instanceof Date) return !Number.isNaN(currentValue.getTime());
            if (typeof currentValue === "string") return !Number.isNaN(new Date(currentValue).getTime());
            return false;
          }
          if (this.fieldType === "select" || this.fieldType === "radio") {
            return typeof currentValue === "string";
          }
          if (this.fieldType === "checkbox") {
            if (typeof currentValue === "boolean") return true;
            if (Array.isArray(currentValue)) return currentValue.every((item) => typeof item === "string");
            return false;
          }

          return true;
        },
        message: "value no coincide con el tipo de campo",
      },
    },
    selectedOptions: {
      type: [selectedOptionSchema],
      required: false,
      default: [],
    },
    required: {
      type: Boolean,
      required: true,
      default: false,
    },
    valid: {
      type: Boolean,
      required: true,
      default: true,
    },
    validationMessage: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const formResponseSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negocios",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "submitted", "cancelled"],
      default: "submitted",
      index: true,
    },
    answers: {
      type: [answerSchema],
      required: true,
      default: [],
    },
    formSnapshot: {
      nombre_formulario: {
        type: String,
        required: true,
        trim: true,
      },
      tipo_servicio: {
        type: String,
        required: false,
        trim: true,
      },
      version: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
    },
    submitChannel: {
      type: String,
      required: true,
      enum: ["WEB", "MOVIL"],
      default: "WEB",
    },
    metadata: {
      ip: {
        type: String,
        required: false,
      },
      userAgent: {
        type: String,
        required: false,
      },
      location: {
        latitude: {
          type: String,
          required: false,
        },
        longitude: {
          type: String,
          required: false,
        },
      },
    },
    startedAt: {
      type: Date,
      required: false,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      required: false,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

formResponseSchema.pre("validate", function validateAnswersUniqueness(next) {
  if (!Array.isArray(this.answers)) return next();

  const fieldIds = this.answers
    .map((answer) => (answer?.fieldId ? String(answer.fieldId) : null))
    .filter(Boolean);

  const hasDuplicates = new Set(fieldIds).size !== fieldIds.length;
  if (hasDuplicates) {
    return next(new Error("No se permiten respuestas duplicadas para el mismo fieldId"));
  }

  if (this.status === "draft") {
    this.submittedAt = undefined;
  }

  if (this.status === "submitted" && !this.submittedAt) {
    this.submittedAt = new Date();
  }

  return next();
});

formResponseSchema.index({ form: 1, status: 1, submittedAt: -1 });
formResponseSchema.index({ negocio: 1, createdAt: -1 });
formResponseSchema.index({ user: 1, createdAt: -1 });
formResponseSchema.index({ "answers.fieldId": 1 });
formResponseSchema.index(
  { form: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $exists: true },
      status: "submitted",
    },
  }
);

module.exports = mongoose.model("FormResponse", formResponseSchema);
