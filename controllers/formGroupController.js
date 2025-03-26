const Form_Group = require("../models/Form_Group");
const Negocios = require("../models/Negocios");

const getFormGroups = async (req, res) => {
    try {
        const formGroups = await Form_Group.find();
        res.status(200).json(formGroups);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const postFormGroup = async (req, res) => {
    try {
        const { nombre_grupo, orden } = req.body;
        const { id_negocio } = req.params;
        if(!id_negocio) return res.status(400).json({ message: "Negocio no encontrado" });
        const negocio = await Negocios.findById(id_negocio);
        if(!negocio) return res.status(400).json({ message: "Negocio no encontrado" });
        const formGroup = new Form_Group({ nombre_grupo, orden });
        negocio.formulario = formGroup._id;
        await formGroup.save();
        await negocio.save();
        res.status(201).json(formGroup);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}

const postFormQuestions = async (req, res) => {
    try {
        const { id_form_group } = req.params;
        const { pregunta, tipo_dato } = req.body;
        const formGroup = await Form_Group.findById(id_form_group);
        formGroup.preguntas.push({ pregunta, tipo_dato });
        await formGroup.save();
        res.status(201).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const postOptions = async (req, res) => {
    try {
        const { id_form_group } = req.params;
        const { id_form_questions } = req.params;
        const { descripcion } = req.body;
        const formGroup = await Form_Group.findById(id_form_group);
        formGroup.preguntas.id(id_form_questions).opciones.push({ descripcion });
        await formGroup.save();
        res.status(201).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = { getFormGroups, postFormGroup, postFormQuestions, postOptions };