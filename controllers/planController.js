const Plan = require("../models/Plan");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : value;

const validMonedas = ["MXN", "USD", "EUR"];
const validPeriodicidades = [
  "mensual",
  "trimestral",
  "semestral",
  "anual",
  "unico",
];

const normalizePlanBody = (body = {}) => ({
  nombre: normalizeText(body.nombre),
  descripcion:
    body.descripcion !== undefined ? normalizeText(body.descripcion) : undefined,
  precio: body.precio !== undefined ? Number(body.precio) : undefined,
  moneda: body.moneda !== undefined ? normalizeText(body.moneda) : undefined,
  periodicidad:
    body.periodicidad !== undefined
      ? normalizeText(body.periodicidad)
      : undefined,
  prueba_dias:
    body.prueba_dias !== undefined ? Number(body.prueba_dias) : undefined,
  beneficios: Array.isArray(body.beneficios)
    ? body.beneficios.map((b) => normalizeText(b))
    : undefined,
  limites:
    body.limites && typeof body.limites === "object"
      ? {
          ...(body.limites.usuarios !== undefined
            ? { usuarios: Number(body.limites.usuarios) }
            : {}),
          ...(body.limites.formularios !== undefined
            ? { formularios: Number(body.limites.formularios) }
            : {}),
          ...(body.limites.respuestas_mensuales !== undefined
            ? {
                respuestas_mensuales: Number(
                  body.limites.respuestas_mensuales
                ),
              }
            : {}),
        }
      : undefined,
  licencias:
    body.licencias !== undefined ? Number(body.licencias) : undefined,
  destacado: body.destacado,
  activo: body.activo,
});

const getPlanes = async (req, res) => {
  try {
    const planes = await Plan.find().sort({ createdAt: -1 });
    res.json(planes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlanById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de plan inválido" });
  }

  try {
    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPlan = async (req, res) => {
  const data = normalizePlanBody(req.body);

  if (!data.nombre) {
    return res.status(400).json({ message: "nombre es obligatorio" });
  }

  if (data.precio === undefined || isNaN(data.precio) || data.precio < 0) {
    return res
      .status(400)
      .json({ message: "precio es obligatorio y debe ser >= 0" });
  }

  if (data.moneda !== undefined && !validMonedas.includes(data.moneda)) {
    return res.status(400).json({
      message: `moneda debe ser uno de: ${validMonedas.join(", ")}`,
    });
  }

  if (
    data.periodicidad !== undefined &&
    !validPeriodicidades.includes(data.periodicidad)
  ) {
    return res.status(400).json({
      message: `periodicidad debe ser uno de: ${validPeriodicidades.join(", ")}`,
    });
  }

  if (
    data.licencias !== undefined &&
    (isNaN(data.licencias) || data.licencias < 1)
  ) {
    return res.status(400).json({ message: "licencias debe ser >= 1" });
  }

  try {
    const plan = new Plan({
      nombre: data.nombre,
      ...(data.descripcion !== undefined
        ? { descripcion: data.descripcion }
        : {}),
      precio: data.precio,
      ...(data.moneda !== undefined ? { moneda: data.moneda } : {}),
      ...(data.periodicidad !== undefined
        ? { periodicidad: data.periodicidad }
        : {}),
      ...(data.prueba_dias !== undefined
        ? { prueba_dias: data.prueba_dias }
        : {}),
      ...(data.beneficios !== undefined ? { beneficios: data.beneficios } : {}),
      ...(data.limites !== undefined ? { limites: data.limites } : {}),
      ...(data.licencias !== undefined ? { licencias: data.licencias } : {}),
      ...(data.destacado !== undefined ? { destacado: data.destacado } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePlan = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de plan inválido" });
  }

  const data = normalizePlanBody(req.body);
  const updates = {};

  if (data.nombre !== undefined) updates.nombre = data.nombre;
  if (data.descripcion !== undefined) updates.descripcion = data.descripcion;

  if (data.precio !== undefined) {
    if (isNaN(data.precio) || data.precio < 0) {
      return res.status(400).json({ message: "precio debe ser >= 0" });
    }
    updates.precio = data.precio;
  }

  if (data.moneda !== undefined) {
    if (!validMonedas.includes(data.moneda)) {
      return res.status(400).json({
        message: `moneda debe ser uno de: ${validMonedas.join(", ")}`,
      });
    }
    updates.moneda = data.moneda;
  }

  if (data.periodicidad !== undefined) {
    if (!validPeriodicidades.includes(data.periodicidad)) {
      return res.status(400).json({
        message: `periodicidad debe ser uno de: ${validPeriodicidades.join(", ")}`,
      });
    }
    updates.periodicidad = data.periodicidad;
  }

  if (data.prueba_dias !== undefined) updates.prueba_dias = data.prueba_dias;
  if (data.beneficios !== undefined) updates.beneficios = data.beneficios;
  if (data.limites !== undefined) updates.limites = data.limites;

  if (data.licencias !== undefined) {
    if (isNaN(data.licencias) || data.licencias < 1) {
      return res.status(400).json({ message: "licencias debe ser >= 1" });
    }
    updates.licencias = data.licencias;
  }

  if (data.destacado !== undefined) updates.destacado = data.destacado;
  if (data.activo !== undefined) updates.activo = data.activo;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No hay campos para actualizar" });
  }

  try {
    const plan = await Plan.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePlan = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de plan inválido" });
  }

  try {
    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    res.json({ message: "Plan eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlanes,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
