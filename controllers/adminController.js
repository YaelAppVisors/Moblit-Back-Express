const mongoose = require("mongoose");
const User = require("../models/User");
const Request = require("../models/Request");
const Hallazgo = require("../models/Hallazgo");
const Negocios = require("../models/Negocios");
const FolioCounter = require("../models/FolioCounter");
const AdminAuditLog = require("../models/AdminAuditLog");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getDashboard = async (req, res) => {
  try {
    const [
      usuariosTotal,
      usuariosActivos,
      ticketsTotal,
      hallazgosTotal,
      negociosActivos,
      folioCounters,
      hallazgosPorEstado,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ activo: true }),
      Request.countDocuments(),
      Hallazgo.countDocuments({ activo: true }),
      Negocios.countDocuments({ activo: true }),
      FolioCounter.find({ activo: true }).select("modulo prefijo anio secuencia"),
      Hallazgo.aggregate([
        { $match: { activo: true } },
        { $group: { _id: "$estado", total: { $sum: 1 } } },
      ]),
    ]);

    return res.json({
      data: {
        usuarios: {
          total: usuariosTotal,
          activos: usuariosActivos,
          inactivos: usuariosTotal - usuariosActivos,
        },
        tickets: {
          total: ticketsTotal,
        },
        hallazgos: {
          total: hallazgosTotal,
          porEstado: hallazgosPorEstado,
        },
        negocios: {
          activos: negociosActivos,
        },
        folios: folioCounters,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const setUserStatus = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de usuario inválido" });
  }

  if (typeof activo !== "boolean") {
    return res.status(400).json({ message: "activo debe ser booleano" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { activo } },
      { new: true, runValidators: true }
    ).select("-password").populate("perfil_ref");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await AdminAuditLog.create({
      accion: activo ? "USER_ENABLE" : "USER_DISABLE",
      entidad: "User",
      entidadId: String(user._id),
      realizadoPor: req.authUser._id,
      metadata: {
        targetUser: user.email,
      },
    });

    return res.json({ data: user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AdminAuditLog.find()
      .populate("realizadoPor", "username email perfil")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ data: logs });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboard,
  setUserStatus,
  getAuditLogs,
};
