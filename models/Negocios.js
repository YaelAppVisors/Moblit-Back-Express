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
      unique: true,
    },
    activo: {
      type: String,
      required: true,
      default: "true",
    },
    formulario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form_Group",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Negocios", NegociosSchema);
