const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject();
  delete user.password;
  return user;
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).populate("negocio");
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
    const user = await User.findById(id);
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
  const { username, email, password, perfil, negocio, location, avatar } = req.body;

  if (!username || !email || !password || !negocio) {
    return res
      .status(400)
      .json({ message: "username, email, password y negocio son obligatorios" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Formato de correo inválido" });
  }

  if (typeof password !== "string" || password.trim().length < 6) {
    return res
      .status(400)
      .json({
        message: "La contraseña debe ser un texto de al menos 6 caracteres",
      });
  }

  if (negocio && !isValidObjectId(negocio)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  if (location && (!Array.isArray(location) || !location.every(hasValidLocation))) {
    return res.status(400).json({
      message:
        "location debe ser un arreglo de objetos con latitude y longitude",
    });
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
      negocio,
      location,
      avatar,
    });
    await newUser.save();
    res.status(201).json(sanitizeUser(newUser));
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
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    res.json({
      message: "Inicio de sesión exitoso",
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, perfil, negocio, location, avatar } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Id de usuario inválido" });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ message: "Formato de correo inválido" });
  }

  if (negocio && !isValidObjectId(negocio)) {
    return res.status(400).json({ message: "Id de negocio inválido" });
  }

  if (
    password !== undefined &&
    (typeof password !== "string" || password.trim().length < 6)
  ) {
    return res
      .status(400)
      .json({
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

  if (avatar !== undefined && typeof avatar !== "string") {
    return res.status(400).json({ message: "avatar debe ser texto" });
  }

  const updates = {};
  if (username !== undefined) updates.username = username;
  if (email !== undefined) updates.email = email;
  if (password !== undefined) {
    updates.password = await bcrypt.hash(password, 10);
  }
  if (perfil !== undefined) updates.perfil = perfil;
  if (negocio !== undefined) updates.negocio = negocio;
  if (location !== undefined) updates.location = location;
  if (avatar !== undefined) updates.avatar = avatar;

  try {
    if (updates.email) {
      const duplicatedEmail = await User.findOne({
        email: updates.email,
        _id: { $ne: id },
      });

      if (duplicatedEmail) {
        return res.status(409).json({ message: "El correo ya está registrado" });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

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