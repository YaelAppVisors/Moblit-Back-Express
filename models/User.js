const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    perfil: {
      type: String,
      enum: ["admin", "user", "coor", "tecnico", "cliente"],
      required: true,
      default: "user",
    },
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negocios",
      required: true,
    },
    plataforma_acceso: {
      type: [
        {
          type: String,
          enum: ["WEB", "MOVIL"],
        },
      ],
      required: false,
      default: ["WEB"],
    },
    location: {
      type: [locationSchema],
      required: false,
    },
    activo: {
      type: Boolean,
      required: true,
      default: true,
    },
    avatar: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
