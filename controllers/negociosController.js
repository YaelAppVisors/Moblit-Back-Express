const Negocios = require("../models/Negocios");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizePlan = (plan = {}) => ({
  nombre: normalizeText(plan.nombre),
  descripcion:
    plan.descripcion !== undefined ? normalizeText(plan.descripcion) : undefined,
  precio: plan.precio !== undefined ? Number(plan.precio) : undefined,
  moneda: plan.moneda !== undefined ? normalizeText(plan.moneda) : undefined,
  periodicidad:
    plan.periodicidad !== undefined ? normalizeText(plan.periodicidad) : undefined,
  prueba_dias:
    plan.prueba_dias !== undefined ? Number(plan.prueba_dias) : undefined,
  beneficios: Array.isArray(plan.beneficios)
    ? plan.beneficios.map((beneficio) => normalizeText(beneficio))
    : undefined,
  limites:
    plan.limites && typeof plan.limites === "object"
      ? {
          ...(plan.limites.usuarios !== undefined
            ? { usuarios: Number(plan.limites.usuarios) }
            : {}),
          ...(plan.limites.formularios !== undefined
            ? { formularios: Number(plan.limites.formularios) }
            : {}),
          ...(plan.limites.respuestas_mensuales !== undefined
            ? { respuestas_mensuales: Number(plan.limites.respuestas_mensuales) }
            : {}),
        }
      : undefined,
  destacado: plan.destacado,
  activo: plan.activo,
});

const validMonedas = ["MXN", "USD", "EUR"];
const validPeriodicidades = [
  "mensual",
  "trimestral",
  "semestral",
  "anual",
  "unico",
];

const isValidPlan = (plan) => {
  if (!plan || typeof plan !== "object") return false;
  if (!plan.nombre || typeof plan.nombre !== "string") return false;
  if (plan.precio === undefined || Number.isNaN(plan.precio) || plan.precio < 0)
    return false;
  if (plan.moneda !== undefined && !validMonedas.includes(plan.moneda))
    return false;
  if (
    plan.periodicidad !== undefined &&
    !validPeriodicidades.includes(plan.periodicidad)
  )
    return false;
  if (
    plan.prueba_dias !== undefined &&
    (Number.isNaN(plan.prueba_dias) || plan.prueba_dias < 0)
  )
    return false;
  if (
    plan.beneficios !== undefined &&
    (!Array.isArray(plan.beneficios) ||
      !plan.beneficios.every((beneficio) => typeof beneficio === "string"))
  )
    return false;
  if (plan.destacado !== undefined && typeof plan.destacado !== "boolean")
    return false;
  if (plan.activo !== undefined && typeof plan.activo !== "boolean") return false;
  if (plan.limites !== undefined) {
    if (!plan.limites || typeof plan.limites !== "object") return false;
    const numericLimits = [
      plan.limites.usuarios,
      plan.limites.formularios,
      plan.limites.respuestas_mensuales,
    ].filter((value) => value !== undefined);
    if (
      numericLimits.some((value) => Number.isNaN(value) || Number(value) < 0)
    )
      return false;
  }
  return true;
};

const getNegocios = async (req, res) => {
  try {
    const negocios = await Negocios.find()
      .populate("formularios")
      .sort({ createdAt: -1 });
    res.json(negocios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNegocioById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  try {
    const negocio = await Negocios.findById(id).populate("formularios");

    if (!negocio) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    res.json(negocio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNegocio = async (req, res) => {
  const nombre_negocio = normalizeText(req.body.nombre_negocio);
  const descripcion_negocio = normalizeText(req.body.descripcion_negocio);
  const sector = normalizeText(req.body.sector);
  const rfc = normalizeText(req.body.rfc);
  const { planes, activo, formularios } = req.body;

  if (!nombre_negocio || !descripcion_negocio || !sector) {
    return res.status(400).json({
      message:
        "nombre_negocio, descripcion_negocio y sector son obligatorios",
    });
  }

  if (planes !== undefined && !Array.isArray(planes)) {
    return res.status(400).json({
      message: "planes debe ser un arreglo de objetos",
    });
  }

  const normalizedPlanes = Array.isArray(planes)
    ? planes.map((plan) => normalizePlan(plan))
    : undefined;

  if (normalizedPlanes !== undefined && !normalizedPlanes.every(isValidPlan)) {
    return res.status(400).json({
      message:
        "planes inválido: cada plan requiere nombre y precio, con tipos válidos",
    });
  }

  if (activo !== undefined && typeof activo !== "boolean") {
    return res.status(400).json({ message: "activo debe ser booleano" });
  }

  if (
    formularios !== undefined &&
    (!Array.isArray(formularios) || !formularios.every(isValidObjectId))
  ) {
    return res.status(400).json({
      message: "formularios debe ser un arreglo de ObjectId válidos",
    });
  }

  try {
    const duplicatedNegocio = await Negocios.findOne({ nombre_negocio });

    if (duplicatedNegocio) {
      return res.status(409).json({
        message: "Ya existe un negocio con el mismo nombre",
      });
    }

    const negocio = new Negocios({
      nombre_negocio,
      descripcion_negocio,
      sector,
      rfc,
      planes: normalizedPlanes || [],
      ...(activo !== undefined ? { activo } : {}),
      formularios: Array.isArray(formularios) ? formularios : [],
    });

    await negocio.save();
    res.status(201).json(negocio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateNegocio = async (req, res) => {
  const { id } = req.params;
  const nombre_negocio = normalizeText(req.body.nombre_negocio);
  const descripcion_negocio = normalizeText(req.body.descripcion_negocio);
  const sector = normalizeText(req.body.sector);
  const rfc = normalizeText(req.body.rfc);
  const { planes, activo, formularios } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  if (activo !== undefined && typeof activo !== "boolean") {
    return res.status(400).json({ message: "activo debe ser booleano" });
  }

  if (planes !== undefined && !Array.isArray(planes)) {
    return res.status(400).json({
      message: "planes debe ser un arreglo de objetos",
    });
  }

  const normalizedPlanes = Array.isArray(planes)
    ? planes.map((plan) => normalizePlan(plan))
    : undefined;

  if (normalizedPlanes !== undefined && !normalizedPlanes.every(isValidPlan)) {
    return res.status(400).json({
      message:
        "planes inválido: cada plan requiere nombre y precio, con tipos válidos",
    });
  }

  if (
    formularios !== undefined &&
    (!Array.isArray(formularios) || !formularios.every(isValidObjectId))
  ) {
    return res.status(400).json({
      message: "formularios debe ser un arreglo de ObjectId válidos",
    });
  }

  const updates = {};
  if (nombre_negocio !== undefined) updates.nombre_negocio = nombre_negocio;
  if (descripcion_negocio !== undefined)
    updates.descripcion_negocio = descripcion_negocio;
  if (sector !== undefined) updates.sector = sector;
  if (rfc !== undefined) updates.rfc = rfc;
  if (normalizedPlanes !== undefined) updates.planes = normalizedPlanes;
  if (activo !== undefined) updates.activo = activo;
  if (formularios !== undefined)
    updates.formularios = [...new Set(formularios.map((id) => id.toString()))];

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No hay campos para actualizar" });
  }

  try {
    if (updates.nombre_negocio) {
      const duplicatedNegocio = await Negocios.findOne({
        _id: { $ne: id },
        nombre_negocio: updates.nombre_negocio,
      });

      if (duplicatedNegocio) {
        return res.status(409).json({
          message: "Ya existe un negocio con el mismo nombre",
        });
      }
    }

    const negocio = await Negocios.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("formularios");

    if (!negocio) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    res.json(negocio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteNegocio = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  try {
    const negocio = await Negocios.findByIdAndDelete(id);

    if (!negocio) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    res.json({ message: "Negocio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNegocios,
  getNegocioById,
  createNegocio,
  updateNegocio,
  deleteNegocio,
};