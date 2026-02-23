const Negocios = require("../models/Negocios");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : value;

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
  const regimen_fiscal = normalizeText(req.body.regimen_fiscal);
  const { formularios } = req.body;

  if (!nombre_negocio || !descripcion_negocio || !regimen_fiscal) {
    return res.status(400).json({
      message:
        "nombre_negocio, descripcion_negocio y regimen_fiscal son obligatorios",
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

  try {
    const duplicatedNegocio = await Negocios.findOne({
      $or: [{ nombre_negocio }, { regimen_fiscal }],
    });

    if (duplicatedNegocio) {
      return res.status(409).json({
        message:
          "Ya existe un negocio con el mismo nombre o régimen fiscal",
      });
    }

    const negocio = new Negocios({
      nombre_negocio,
      descripcion_negocio,
      regimen_fiscal,
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
  const regimen_fiscal = normalizeText(req.body.regimen_fiscal);
  const { activo, formularios } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
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

  const updates = {};
  if (nombre_negocio !== undefined) updates.nombre_negocio = nombre_negocio;
  if (descripcion_negocio !== undefined)
    updates.descripcion_negocio = descripcion_negocio;
  if (regimen_fiscal !== undefined) updates.regimen_fiscal = regimen_fiscal;
  if (activo !== undefined) updates.activo = activo;
  if (formularios !== undefined)
    updates.formularios = [...new Set(formularios.map((id) => id.toString()))];

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No hay campos para actualizar" });
  }

  try {
    if (updates.nombre_negocio || updates.regimen_fiscal) {
      const duplicatedNegocio = await Negocios.findOne({
        _id: { $ne: id },
        $or: [
          ...(updates.nombre_negocio
            ? [{ nombre_negocio: updates.nombre_negocio }]
            : []),
          ...(updates.regimen_fiscal
            ? [{ regimen_fiscal: updates.regimen_fiscal }]
            : []),
        ],
      });

      if (duplicatedNegocio) {
        return res.status(409).json({
          message:
            "Ya existe un negocio con el mismo nombre o régimen fiscal",
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