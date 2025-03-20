const User = require("../models/User");

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
  const { username, email, password, location } = req.body;
  try {
    const newUser = new User({ username, email, password, location });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const putUserLocation = async (req, res) => {
  const { location } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.location.push(location); // Agrega la nueva ubicación al array
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, putUserLocation };