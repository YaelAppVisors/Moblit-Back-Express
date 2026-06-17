const mongoose = require("mongoose");
const Report = require("../models/Report");
const Request = require("../models/Request");
const Hallazgo = require("../models/Hallazgo");
const { nextFolio } = require("../services/folio.service");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const buildDateQuery = ({ fechaInicio, fechaFin }) => {
  const startDate = parseDate(fechaInicio);
  const endDate = parseDate(fechaFin);

  if (!startDate && !endDate) return {};

  const createdAt = {};
  if (startDate) createdAt.$gte = startDate;
  if (endDate) createdAt.$lte = endDate;
  return { createdAt };
};

const generateOperationalReport = async (req, res) => {
  const { fechaInicio, fechaFin, negocio } = req.body || {};

  if (negocio && !isValidObjectId(negocio)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  try {
    const dateFilter = buildDateQuery({ fechaInicio, fechaFin });

    const requestFilter = { ...dateFilter };
    if (negocio) requestFilter["requestHeader.store"] = new mongoose.Types.ObjectId(negocio);

    const hallazgoFilter = { ...dateFilter, activo: true };
    if (negocio) {
      const requestIds = await Request.find({ "requestHeader.store": negocio }).distinct("_id");
      hallazgoFilter.id_registro_lista_verificacion = { $in: requestIds };
    }

    const [ticketsTotal, hallazgosTotal, hallazgosPorEstado] = await Promise.all([
      Request.countDocuments(requestFilter),
      Hallazgo.countDocuments(hallazgoFilter),
      Hallazgo.aggregate([
        { $match: hallazgoFilter },
        { $group: { _id: "$estado", total: { $sum: 1 } } },
      ]),
    ]);

    const reportFolio = await nextFolio({
      modulo: "REPORT",
      negocio: negocio || null,
      prefijo: "RPT",
    });

    const payload = {
      tipo: "admin",
      folio: reportFolio.folio,
      generadoPor: req.authUser._id,
      negocio: negocio || null,
      filtros: { fechaInicio: fechaInicio || null, fechaFin: fechaFin || null, negocio: negocio || null },
      resumen: {
        ticketsTotal,
        hallazgosTotal,
        hallazgosPorEstado,
      },
      detalle: {},
      estatus: "generado",
    };

    const report = await Report.create(payload);

    return res.status(201).json({ data: report });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("generadoPor", "username email perfil")
      .populate("negocio", "nombre_negocio")
      .sort({ createdAt: -1 });

    return res.json({ data: reports });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getReportById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de reporte inválido" });
  }

  try {
    const report = await Report.findById(id)
      .populate("generadoPor", "username email perfil")
      .populate("negocio", "nombre_negocio");

    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    return res.json({ data: report });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateOperationalReport,
  getReports,
  getReportById,
};
