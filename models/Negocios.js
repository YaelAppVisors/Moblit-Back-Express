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
      required: true,
      unique: false,
    },
    regimen_fiscal: {
      type: String,
      required: false,
      unique: true,
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
          ref: "Form_Group",
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
