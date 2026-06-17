const mongoose = require("mongoose");

const AdminAuditLogSchema = new mongoose.Schema(
  {
    accion: {
      type: String,
      required: true,
      trim: true,
    },
    entidad: {
      type: String,
      required: true,
      trim: true,
    },
    entidadId: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    realizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      type: Object,
      required: false,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdminAuditLog", AdminAuditLogSchema);
