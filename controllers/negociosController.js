const Negocios = require("../models/Negocios");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : value;

const DESFASE_DEFAULTS = {
  bajo: 1,
  medio: 3,
  alto: 6,
  bajoCo: "#22c55e",
  medioCo: "#f59e0b",
  altoCo: "#ef4444",
};

const isValidColor = (color) =>
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);

const validateDesfaseOrdering = (bajo, medio, alto) => {
  if (bajo > medio) {
    return "desfase_bajo_horas no puede ser mayor que desfase_medio_horas";
  }
  if (medio > alto) {
    return "desfase_medio_horas no puede ser mayor que desfase_alto_horas";
  }
  return null;
};

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
  const bajoParsed = req.body.desfase_bajo_horas !== undefined ? Number(req.body.desfase_bajo_horas) : undefined;
  const medioParsed = req.body.desfase_medio_horas !== undefined ? Number(req.body.desfase_medio_horas) : undefined;
  const altoParsed = req.body.desfase_alto_horas !== undefined ? Number(req.body.desfase_alto_horas) : undefined;
  const bajoEffective = bajoParsed !== undefined ? bajoParsed : DESFASE_DEFAULTS.bajo;
  const medioEffective = medioParsed !== undefined ? medioParsed : DESFASE_DEFAULTS.medio;
  const altoEffective = altoParsed !== undefined ? altoParsed : DESFASE_DEFAULTS.alto;
  const bajoColorParsed = req.body.desfase_bajo_color !== undefined ? String(req.body.desfase_bajo_color).trim() : undefined;
  const medioColorParsed = req.body.desfase_medio_color !== undefined ? String(req.body.desfase_medio_color).trim() : undefined;
  const altoColorParsed = req.body.desfase_alto_color !== undefined ? String(req.body.desfase_alto_color).trim() : undefined;
  const bajoColorEffective = bajoColorParsed || DESFASE_DEFAULTS.bajoCo;
  const medioColorEffective = medioColorParsed || DESFASE_DEFAULTS.medioCo;
  const altoColorEffective = altoColorParsed || DESFASE_DEFAULTS.altoCo;

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

  for (const [key, val] of [
    ["desfase_bajo_horas", bajoParsed],
    ["desfase_medio_horas", medioParsed],
    ["desfase_alto_horas", altoParsed],
  ]) {
    if (val !== undefined && (Number.isNaN(val) || val < 0)) {
      return res.status(400).json({
        message: `${key} debe ser un número mayor o igual a 0`,
      });
    }
  }

  for (const [key, val] of [
    ["desfase_bajo_color", bajoColorParsed],
    ["desfase_medio_color", medioColorParsed],
    ["desfase_alto_color", altoColorParsed],
  ]) {
    if (val !== undefined && !isValidColor(val)) {
      return res.status(400).json({
        message: `${key} debe ser un color hexadecimal válido (ej. #ff0000)`,
      });
    }
  }

  const createDesfaseError = validateDesfaseOrdering(bajoEffective, medioEffective, altoEffective);
  if (createDesfaseError) {
    return res.status(400).json({ message: createDesfaseError });
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
      desfase_bajo_horas: bajoEffective,
      desfase_bajo_color: bajoColorEffective,
      desfase_medio_horas: medioEffective,
      desfase_medio_color: medioColorEffective,
      desfase_alto_horas: altoEffective,
      desfase_alto_color: altoColorEffective,
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
  const bajoParsedUpd = req.body.desfase_bajo_horas !== undefined ? Number(req.body.desfase_bajo_horas) : undefined;
  const medioParsedUpd = req.body.desfase_medio_horas !== undefined ? Number(req.body.desfase_medio_horas) : undefined;
  const altoParsedUpd = req.body.desfase_alto_horas !== undefined ? Number(req.body.desfase_alto_horas) : undefined;
  const bajoColorUpd = req.body.desfase_bajo_color !== undefined ? String(req.body.desfase_bajo_color).trim() : undefined;
  const medioColorUpd = req.body.desfase_medio_color !== undefined ? String(req.body.desfase_medio_color).trim() : undefined;
  const altoColorUpd = req.body.desfase_alto_color !== undefined ? String(req.body.desfase_alto_color).trim() : undefined;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  if (activo !== undefined && typeof activo !== "boolean") {
    return res.status(400).json({ message: "activo debe ser booleano" });
  }

  if (plan !== undefined && plan !== null && !isValidObjectId(plan)) {
    return res.status(400).json({ message: "plan debe ser un ObjectId válido" });
  }

  for (const [key, val] of [
    ["desfase_bajo_horas", bajoParsedUpd],
    ["desfase_medio_horas", medioParsedUpd],
    ["desfase_alto_horas", altoParsedUpd],
  ]) {
    if (val !== undefined && (Number.isNaN(val) || val < 0)) {
      return res.status(400).json({
        message: `${key} debe ser un número mayor o igual a 0`,
      });
    }
  }

  for (const [key, val] of [
    ["desfase_bajo_color", bajoColorUpd],
    ["desfase_medio_color", medioColorUpd],
    ["desfase_alto_color", altoColorUpd],
  ]) {
    if (val !== undefined && !isValidColor(val)) {
      return res.status(400).json({
        message: `${key} debe ser un color hexadecimal válido (ej. #ff0000)`,
      });
    }
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
  if (bajoParsedUpd !== undefined) updates.desfase_bajo_horas = bajoParsedUpd;
  if (bajoColorUpd !== undefined) updates.desfase_bajo_color = bajoColorUpd;
  if (medioParsedUpd !== undefined) updates.desfase_medio_horas = medioParsedUpd;
  if (medioColorUpd !== undefined) updates.desfase_medio_color = medioColorUpd;
  if (altoParsedUpd !== undefined) updates.desfase_alto_horas = altoParsedUpd;
  if (altoColorUpd !== undefined) updates.desfase_alto_color = altoColorUpd;
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

    if (bajoParsedUpd !== undefined || medioParsedUpd !== undefined || altoParsedUpd !== undefined) {
      const existingNegocio = await Negocios.findById(id).select(
        "desfase_bajo_horas desfase_bajo_color desfase_medio_horas desfase_medio_color desfase_alto_horas desfase_alto_color"
      );
      if (!existingNegocio) {
        return res.status(404).json({ message: "Negocio no encontrado" });
      }
      const bajoCheck = bajoParsedUpd !== undefined ? bajoParsedUpd : existingNegocio.desfase_bajo_horas;
      const medioCheck = medioParsedUpd !== undefined ? medioParsedUpd : existingNegocio.desfase_medio_horas;
      const altoCheck = altoParsedUpd !== undefined ? altoParsedUpd : existingNegocio.desfase_alto_horas;
      const updDesfaseError = validateDesfaseOrdering(bajoCheck, medioCheck, altoCheck);
      if (updDesfaseError) {
        return res.status(400).json({ message: updDesfaseError });
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

const getDesfaseNegocio = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  try {
    const negocio = await Negocios.findById(id).select(
      "desfase_bajo_horas desfase_bajo_color desfase_medio_horas desfase_medio_color desfase_alto_horas desfase_alto_color"
    );

    if (!negocio) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    res.json({
      desfase_bajo_horas: negocio.desfase_bajo_horas,
      desfase_bajo_color: negocio.desfase_bajo_color,
      desfase_medio_horas: negocio.desfase_medio_horas,
      desfase_medio_color: negocio.desfase_medio_color,
      desfase_alto_horas: negocio.desfase_alto_horas,
      desfase_alto_color: negocio.desfase_alto_color,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDesfaseNegocio = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  const {
    desfase_bajo_horas,
    desfase_bajo_color,
    desfase_medio_horas,
    desfase_medio_color,
    desfase_alto_horas,
    desfase_alto_color,
  } = req.body;

  if (
    desfase_bajo_horas === undefined &&
    desfase_bajo_color === undefined &&
    desfase_medio_horas === undefined &&
    desfase_medio_color === undefined &&
    desfase_alto_horas === undefined &&
    desfase_alto_color === undefined
  ) {
    return res.status(400).json({
      message: "Debe proporcionar al menos un campo de desfase para actualizar",
    });
  }

  for (const [key, val] of [
    ["desfase_bajo_horas", desfase_bajo_horas],
    ["desfase_medio_horas", desfase_medio_horas],
    ["desfase_alto_horas", desfase_alto_horas],
  ]) {
    if (val !== undefined) {
      const num = Number(val);
      if (Number.isNaN(num) || num < 0) {
        return res.status(400).json({
          message: `${key} debe ser un número mayor o igual a 0`,
        });
      }
    }
  }

  for (const [key, val] of [
    ["desfase_bajo_color", desfase_bajo_color],
    ["desfase_medio_color", desfase_medio_color],
    ["desfase_alto_color", desfase_alto_color],
  ]) {
    if (val !== undefined && !isValidColor(String(val).trim())) {
      return res.status(400).json({
        message: `${key} debe ser un color hexadecimal válido (ej. #ff0000)`,
      });
    }
  }

  try {
    const negocio = await Negocios.findById(id);

    if (!negocio) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    const bajo =
      desfase_bajo_horas !== undefined
        ? Number(desfase_bajo_horas)
        : negocio.desfase_bajo_horas;
    const medio =
      desfase_medio_horas !== undefined
        ? Number(desfase_medio_horas)
        : negocio.desfase_medio_horas;
    const alto =
      desfase_alto_horas !== undefined
        ? Number(desfase_alto_horas)
        : negocio.desfase_alto_horas;
    const bajoColor =
      desfase_bajo_color !== undefined
        ? String(desfase_bajo_color).trim()
        : negocio.desfase_bajo_color;
    const medioColor =
      desfase_medio_color !== undefined
        ? String(desfase_medio_color).trim()
        : negocio.desfase_medio_color;
    const altoColor =
      desfase_alto_color !== undefined
        ? String(desfase_alto_color).trim()
        : negocio.desfase_alto_color;

    const orderingError = validateDesfaseOrdering(bajo, medio, alto);
    if (orderingError) {
      return res.status(400).json({ message: orderingError });
    }

    const updated = await Negocios.findByIdAndUpdate(
      id,
      {
        desfase_bajo_horas: bajo,
        desfase_bajo_color: bajoColor,
        desfase_medio_horas: medio,
        desfase_medio_color: medioColor,
        desfase_alto_horas: alto,
        desfase_alto_color: altoColor,
      },
      { new: true, runValidators: true }
    );

    res.json({
      desfase_bajo_horas: updated.desfase_bajo_horas,
      desfase_bajo_color: updated.desfase_bajo_color,
      desfase_medio_horas: updated.desfase_medio_horas,
      desfase_medio_color: updated.desfase_medio_color,
      desfase_alto_horas: updated.desfase_alto_horas,
      desfase_alto_color: updated.desfase_alto_color,
    });
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
  getDesfaseNegocio,
  updateDesfaseNegocio,
};