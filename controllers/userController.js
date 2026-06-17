const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { resolveUserPermissions } = require("../services/rbac.service");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidEmail = (email = "") => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const hasValidLocation = (location) => {
  if (!location || typeof location !== "object") return false;
  const { latitude, longitude } = location;
  return (
    typeof latitude === "string" &&
    latitude.trim() !== "" &&
    typeof longitude === "string" &&
    longitude.trim() !== ""
  );
};

const PLATFORM_ACCESS_VALUES = ["WEB", "MOVIL"];

const hasValidPlatformAccess = (platformAccess) => {
  // Si llega como string JSON, parsearlo
  let access = platformAccess;
  if (typeof platformAccess === 'string') {
    try {
      access = JSON.parse(platformAccess);
    } catch (e) {
      return false;
    }
  }
  
  if (!Array.isArray(access) || access.length === 0)
    return false;
  return access.every(
    (platform) =>
      typeof platform === "string" &&
      PLATFORM_ACCESS_VALUES.includes(platform.trim().toUpperCase()),
  );
};

const normalizePlatformAccess = (platformAccess = []) => {
  // Si llega como string JSON, parsearlo
  let access = platformAccess;
  if (typeof platformAccess === 'string') {
    try {
      access = JSON.parse(platformAccess);
    } catch (e) {
      return [];
    }
  }
  
  if (!Array.isArray(access)) return [];
  return [...new Set(access.map((platform) => platform.trim().toUpperCase()))];
};

const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject();
  delete user.password;
  return user;
};

// Obtener todos los usuarios con filtros opcionales
const getUsers = async (req, res) => {
  try {
    const { perfil, negocio } = req.query;
    const query = {};

    if (perfil) {
      query.perfil = perfil;
    }

    if (negocio) {
      if (!isValidObjectId(negocio)) {
        return res
          .status(400)
          .json({ message: "Id de negocio inválido para el filtro" });
      }
      query.negocio = negocio;
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .populate("negocio")
      .populate("perfil_ref");

    res.json(users.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de usuario inválido" });
  }

  try {
    const user = await User.findById(id)
      .populate("negocio")
      .populate("perfil_ref");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
  const {
    username,
    email,
    password,
    perfil,
    perfil_ref,
    permissions_override,
    negocio,
    plataforma_acceso,
    location,
    avatar,
  } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "username, email y password son obligatorios" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Formato de correo inválido" });
  }

  if (typeof password !== "string" || password.trim().length < 6) {
    return res.status(400).json({
      message: "La contraseña debe ser un texto de al menos 6 caracteres",
    });
  }

  if (negocio && !isValidObjectId(negocio)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  if (perfil_ref && !isValidObjectId(perfil_ref)) {
    return res.status(400).json({ message: "Id de perfil inválido" });
  }

  if (
    location &&
    (!Array.isArray(location) || !location.every(hasValidLocation))
  ) {
    return res.status(400).json({
      message:
        "location debe ser un arreglo de objetos con latitude y longitude",
    });
  }

  if (
    plataforma_acceso !== undefined &&
    !hasValidPlatformAccess(plataforma_acceso)
  ) {
    return res.status(400).json({
      message: "plataforma_acceso debe ser un arreglo con WEB y/o MOVIL",
    });
  }

  const avatarPath = req.file
    ? `/uploads/${req.file.filename}`
    : avatar !== undefined
      ? avatar
      : undefined;

  if (!req.file && avatar !== undefined && typeof avatar !== "string") {
    return res.status(400).json({ message: "avatar debe ser texto" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      perfil,
      perfil_ref,
      permissions_override,
      negocio,
      plataforma_acceso:
        plataforma_acceso !== undefined
          ? normalizePlatformAccess(plataforma_acceso)
          : undefined,
      location,
      avatar: avatarPath,
    });
    await newUser.save();

    const createdUser = await User.findById(newUser._id)
      .populate("negocio")
      .populate("perfil_ref");
    res.status(201).json(sanitizeUser(createdUser));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "email y password son obligatorios" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Formato de correo inválido" });
  }

  try {
    const user = await User.findOne({ email })
      .populate("negocio")
      .populate("perfil_ref");

    if (!user) {
      return res.status(401).json({ message: "El usuario no existe" });
    }

    if (user?.activo === false) {
      return res
        .status(401)
        .json({ message: "El usuario se encuentra inhabilitado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "La contraseña es incorrecta" });
    }

    const token = jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        perfil: user.perfil,
      },
      process.env.JWT_SECRET || "change_this_secret",
      {
        expiresIn: "12h",
      },
    );

    res.json({
      status: "success",
      code: 200,
      message: "Inicio de sesión exitoso",
      token,
      permissions: resolveUserPermissions(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    username,
    email,
    password,
    perfil,
    perfil_ref,
    permissions_override,
    negocio,
    plataforma_acceso,
    location,
    avatar,
    activo,
  } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de usuario inválido" });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ message: "Formato de correo inválido" });
  }

  if (negocio && !isValidObjectId(negocio)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  if (perfil_ref && !isValidObjectId(perfil_ref)) {
    return res.status(400).json({ message: "Id de perfil inválido" });
  }

  if (
    password !== undefined &&
    (typeof password !== "string" || password.trim().length < 6)
  ) {
    return res.status(400).json({
      message: "La contraseña debe ser un texto de al menos 6 caracteres",
    });
  }

  if (location !== undefined) {
    if (!Array.isArray(location) || !location.every(hasValidLocation)) {
      return res.status(400).json({
        message:
          "location debe ser un arreglo de objetos con latitude y longitude",
      });
    }
  }
  console.log("Plataforma acceso recibido:", plataforma_acceso);
  console.log("Tipo:", typeof plataforma_acceso, "Es array:", Array.isArray(plataforma_acceso));
  if (
    plataforma_acceso !== undefined &&
    !hasValidPlatformAccess(plataforma_acceso)
  ) {
    return res.status(400).json({
      message: "plataforma_acceso debe ser un arreglo con WEB y/o MOVIL",
    });
  }

  const avatarPath = req.file
    ? `/uploads/${req.file.filename}`
    : avatar !== undefined
      ? avatar
      : undefined;

  console.log("Avatar recibido:", avatar);

  if (!req.file && avatar !== undefined && typeof avatar !== "string") {
    return res.status(400).json({ message: "avatar debe ser texto" });
  }

  const updates = {};
  if (username !== undefined) updates.username = username;
  if (email !== undefined) updates.email = email;
  if (password !== undefined) {
    updates.password = await bcrypt.hash(password, 10);
  }
  if (perfil !== undefined) updates.perfil = perfil;
  if (perfil_ref !== undefined) updates.perfil_ref = perfil_ref || null;
  if (permissions_override !== undefined) {
    updates.permissions_override = Array.isArray(permissions_override)
      ? [...new Set(permissions_override)]
      : [];
  }
  if (negocio !== undefined) updates.negocio = negocio;
  if (plataforma_acceso !== undefined) {
    updates.plataforma_acceso = normalizePlatformAccess(plataforma_acceso);
  }
  if (location !== undefined) updates.location = location;
  if (avatarPath !== undefined) updates.avatar = avatarPath;
  if (activo !== undefined) updates.activo = activo;

  try {
    if (updates.email) {
      const duplicatedEmail = await User.findOne({
        email: updates.email,
        _id: { $ne: id },
      });

      if (duplicatedEmail) {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado" });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("negocio")
      .populate("perfil_ref");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const putUserLocation = async (req, res) => {
  const { location } = req.body;

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Id de usuario inválido" });
  }

  if (!hasValidLocation(location)) {
    return res.status(400).json({
      message: "location debe contener latitude y longitude",
    });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!Array.isArray(user.location)) {
      user.location = [];
    }

    user.location.push(location);
    await user.save();
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de usuario inválido" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  putUserLocation,
  deleteUser,
};
