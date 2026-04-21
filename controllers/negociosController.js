const Negocios = require("../models/Negocios");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : value;

const getNegocios = async (req, res) => {
  try {
    const negocios = await Negocios.find()
      .populate("formularios")
      .populate("plan")
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
    const negocio = await Negocios.findById(id)
      .populate("formularios")
      .populate("plan");

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
  const { plan, activo, formularios } = req.body;

  if (!nombre_negocio || !descripcion_negocio || !sector) {
    return res.status(400).json({
      message:
        "nombre_negocio, descripcion_negocio y sector son obligatorios",
    });
  }

  if (plan !== undefined && plan !== null && !isValidObjectId(plan)) {
    return res.status(400).json({ message: "plan debe ser un ObjectId válido" });
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
      ...(plan !== undefined ? { plan: plan || null } : {}),
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
  const { plan, activo, formularios } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  if (activo !== undefined && typeof activo !== "boolean") {
    return res.status(400).json({ message: "activo debe ser booleano" });
  }

  if (plan !== undefined && plan !== null && !isValidObjectId(plan)) {
    return res.status(400).json({ message: "plan debe ser un ObjectId válido" });
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
  if (plan !== undefined) updates.plan = plan || null;
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
    })
      .populate("formularios")
      .populate("plan");

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