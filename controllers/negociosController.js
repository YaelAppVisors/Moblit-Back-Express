const Negocios = require("../models/Negocios");

const getNegocios = async (req, res) => {
  try {
    const negocios = await Negocios.find();
    res.json(negocios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNegocio = async (req, res) => {
  try {
    const { nombre_negocio, descripcion_negocio } = req.body;
    const negocio = new Negocios({ nombre_negocio, descripcion_negocio });
    await negocio.save();
    res.status(201).json(negocio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getNegocios, createNegocio };