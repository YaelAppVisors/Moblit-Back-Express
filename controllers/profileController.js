const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { normalizePermissions, DEFAULT_PROFILE_DEFINITIONS } = require("../services/rbac.service");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ key: 1 });
    return res.json({ data: profiles });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createProfile = async (req, res) => {
  const { key, nombre, descripcion, permisos, activo } = req.body;

  if (!key || !nombre) {
    return res.status(400).json({ message: "key y nombre son obligatorios" });
  }

  try {
    const exists = await Profile.findOne({ key: String(key).toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "Ya existe un perfil con ese key" });
    }

    const profile = await Profile.create({
      key: String(key).toLowerCase().trim(),
      nombre: String(nombre).trim(),
      descripcion: typeof descripcion === "string" ? descripcion.trim() : "",
      permisos: normalizePermissions(permisos || []),
      activo: typeof activo === "boolean" ? activo : true,
      sistema: false,
    });

    return res.status(201).json({ data: profile });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, permisos, activo } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de perfil inválido" });
  }

  try {
    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    if (nombre !== undefined) profile.nombre = String(nombre).trim();
    if (descripcion !== undefined) profile.descripcion = String(descripcion).trim();
    if (permisos !== undefined) profile.permisos = normalizePermissions(permisos);
    if (activo !== undefined) profile.activo = !!activo;

    await profile.save();
    return res.json({ data: profile });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteProfile = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de perfil inválido" });
  }

  try {
    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    if (profile.sistema) {
      return res.status(400).json({ message: "No se puede eliminar un perfil de sistema" });
    }

    await User.updateMany({ perfil_ref: profile._id }, { $set: { perfil_ref: null } });
    await Profile.findByIdAndDelete(id);

    return res.json({ message: "Perfil eliminado" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const assignProfileToUser = async (req, res) => {
  const { userId } = req.params;
  const { profileId } = req.body;

  if (!isValidObjectId(userId) || !isValidObjectId(profileId)) {
    return res.status(400).json({ message: "userId y profileId deben ser ObjectId válidos" });
  }

  try {
    const [user, profile] = await Promise.all([
      User.findById(userId),
      Profile.findById(profileId),
    ]);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!profile) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    user.perfil = profile.key;
    user.perfil_ref = profile._id;
    await user.save();

    const updatedUser = await User.findById(userId).select("-password").populate("perfil_ref");

    return res.json({ data: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDefaultPermissionCatalog = async (req, res) => {
  return res.json({ data: DEFAULT_PROFILE_DEFINITIONS });
};

module.exports = {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  assignProfileToUser,
  getDefaultPermissionCatalog,
};
