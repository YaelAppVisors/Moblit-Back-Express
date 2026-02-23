const Form_Group = require("../models/Form_Group");
const Negocios = require("../models/Negocios");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeText = (value) =>
    typeof value === "string" ? value.trim() : value;

const normalizeOptionalText = (value) => {
    if (value === undefined) return undefined;
    return normalizeText(value);
};

const parseOptionalNumber = (value) => {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const getFormGroups = async (req, res) => {
    try {
        const formGroups = await Form_Group.find().sort({ createdAt: -1 });
        res.status(200).json(formGroups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFormGroupById = async (req, res) => {
    const { id_form_group } = req.params;

    if (!isValidObjectId(id_form_group)) {
        return res.status(400).json({ message: "Id de formulario inválido" });
    }

    try {
        const formGroup = await Form_Group.findById(id_form_group);

        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        res.status(200).json(formGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFormGroupsByNegocio = async (req, res) => {
    const { id_negocio } = req.params;

    if (!isValidObjectId(id_negocio)) {
        return res.status(400).json({ message: "Id de negocio inválido" });
    }

    try {
        const negocio = await Negocios.findById(id_negocio).populate({
            path: "formularios",
            options: { sort: { orden: 1, createdAt: -1 } },
        });

        if (!negocio) {
            return res.status(404).json({ message: "Negocio no encontrado" });
        }

        res.status(200).json(negocio.formularios || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postFormGroup = async (req, res) => {
    const { id_negocio } = req.params;
    const nombre_grupo = normalizeText(req.body.nombre_grupo);
    const ordenNumber = Number(req.body.orden);

    if (!isValidObjectId(id_negocio)) {
        return res.status(400).json({ message: "Id de negocio inválido" });
    }

    if (!nombre_grupo || Number.isNaN(ordenNumber)) {
        return res.status(400).json({
            message: "nombre_grupo y orden son obligatorios",
        });
    }

    try {
        const negocio = await Negocios.findById(id_negocio);
        if (!negocio) {
            return res.status(404).json({ message: "Negocio no encontrado" });
        }

        const formGroup = new Form_Group({ nombre_grupo, orden: ordenNumber });

        await formGroup.save();

        if (!Array.isArray(negocio.formularios)) {
            negocio.formularios = [];
        }

        const alreadyLinked = negocio.formularios.some(
            (id) => id.toString() === formGroup._id.toString()
        );

        if (!alreadyLinked) {
            negocio.formularios.push(formGroup._id);
            await negocio.save();
        }

        res.status(201).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateFormGroup = async (req, res) => {
    const { id_form_group } = req.params;
    const nombre_grupo = normalizeOptionalText(req.body.nombre_grupo);
    const ordenNumber = parseOptionalNumber(req.body.orden);
    const { activo } = req.body;

    if (!isValidObjectId(id_form_group)) {
        return res.status(400).json({ message: "Id de formulario inválido" });
    }

    if (ordenNumber === null) {
        return res.status(400).json({ message: "orden debe ser numérico" });
    }

    if (activo !== undefined && typeof activo !== "boolean") {
        return res.status(400).json({ message: "activo debe ser booleano" });
    }

    const updates = {};
    if (nombre_grupo !== undefined) updates.nombre_grupo = nombre_grupo;
    if (ordenNumber !== undefined) updates.orden = ordenNumber;
    if (activo !== undefined) updates.activo = activo;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No hay campos para actualizar" });
    }

    try {
        const formGroup = await Form_Group.findByIdAndUpdate(id_form_group, updates, {
            new: true,
            runValidators: true,
        });

        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        res.status(200).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteFormGroup = async (req, res) => {
    const { id_form_group } = req.params;

    if (!isValidObjectId(id_form_group)) {
        return res.status(400).json({ message: "Id de formulario inválido" });
    }

    try {
        const formGroup = await Form_Group.findByIdAndDelete(id_form_group);

        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        await Negocios.updateMany(
            { formularios: formGroup._id },
            { $pull: { formularios: formGroup._id } }
        );

        res.status(200).json({ message: "Grupo de formulario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postFormQuestions = async (req, res) => {
    const { id_form_group } = req.params;
    const pregunta = normalizeText(req.body.pregunta);
    const tipo_dato = normalizeText(req.body.tipo_dato);

    if (!isValidObjectId(id_form_group)) {
        return res.status(400).json({ message: "Id de formulario inválido" });
    }

    if (!pregunta || !tipo_dato) {
        return res.status(400).json({
            message: "pregunta y tipo_dato son obligatorios",
        });
    }

    try {
        const formGroup = await Form_Group.findById(id_form_group);
        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        formGroup.preguntas.push({ pregunta, tipo_dato });
        await formGroup.save();
        res.status(201).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateFormQuestion = async (req, res) => {
    const { id_form_group, id_form_questions } = req.params;
    const pregunta = normalizeOptionalText(req.body.pregunta);
    const tipo_dato = normalizeOptionalText(req.body.tipo_dato);
    const { activo } = req.body;

    if (!isValidObjectId(id_form_group) || !isValidObjectId(id_form_questions)) {
        return res
            .status(400)
            .json({ message: "Id de formulario o pregunta inválido" });
    }

    if (activo !== undefined && typeof activo !== "boolean") {
        return res.status(400).json({ message: "activo debe ser booleano" });
    }

    if (pregunta === undefined && tipo_dato === undefined && activo === undefined) {
        return res.status(400).json({ message: "No hay campos para actualizar" });
    }

    try {
        const formGroup = await Form_Group.findById(id_form_group);
        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        const question = formGroup.preguntas.id(id_form_questions);

        if (!question) {
            return res.status(404).json({ message: "Pregunta no encontrada" });
        }

        if (pregunta !== undefined) question.pregunta = pregunta;
        if (tipo_dato !== undefined) question.tipo_dato = tipo_dato;
        if (activo !== undefined) question.activo = activo;

        await formGroup.save();
        res.status(200).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteFormQuestion = async (req, res) => {
    const { id_form_group, id_form_questions } = req.params;

    if (!isValidObjectId(id_form_group) || !isValidObjectId(id_form_questions)) {
        return res
            .status(400)
            .json({ message: "Id de formulario o pregunta inválido" });
    }

    try {
        const formGroup = await Form_Group.findById(id_form_group);
        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        const question = formGroup.preguntas.id(id_form_questions);

        if (!question) {
            return res.status(404).json({ message: "Pregunta no encontrada" });
        }

        question.deleteOne();
        await formGroup.save();
        res.status(200).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const postOptions = async (req, res) => {
    const { id_form_group, id_form_questions } = req.params;
    const descripcion = normalizeText(req.body.descripcion);

    if (!isValidObjectId(id_form_group) || !isValidObjectId(id_form_questions)) {
        return res
            .status(400)
            .json({ message: "Id de formulario o pregunta inválido" });
    }

    if (!descripcion) {
        return res.status(400).json({ message: "descripcion es obligatoria" });
    }

    try {
        const formGroup = await Form_Group.findById(id_form_group);

        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        const question = formGroup.preguntas.id(id_form_questions);

        if (!question) {
            return res.status(404).json({ message: "Pregunta no encontrada" });
        }

        question.opciones.push({ descripcion });
        await formGroup.save();
        res.status(201).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateOption = async (req, res) => {
    const { id_form_group, id_form_questions, id_option } = req.params;
    const descripcion = normalizeOptionalText(req.body.descripcion);
    const { activo } = req.body;

    if (
        !isValidObjectId(id_form_group) ||
        !isValidObjectId(id_form_questions) ||
        !isValidObjectId(id_option)
    ) {
        return res
            .status(400)
            .json({ message: "Id de formulario, pregunta u opción inválido" });
    }

    if (activo !== undefined && typeof activo !== "boolean") {
        return res.status(400).json({ message: "activo debe ser booleano" });
    }

    if (descripcion === undefined && activo === undefined) {
        return res.status(400).json({ message: "No hay campos para actualizar" });
    }

    try {
        const formGroup = await Form_Group.findById(id_form_group);

        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        const question = formGroup.preguntas.id(id_form_questions);

        if (!question) {
            return res.status(404).json({ message: "Pregunta no encontrada" });
        }

        const option = question.opciones.id(id_option);

        if (!option) {
            return res.status(404).json({ message: "Opción no encontrada" });
        }

        if (descripcion !== undefined) option.descripcion = descripcion;
        if (activo !== undefined) option.activo = activo;

        await formGroup.save();
        res.status(200).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteOption = async (req, res) => {
    const { id_form_group, id_form_questions, id_option } = req.params;

    if (
        !isValidObjectId(id_form_group) ||
        !isValidObjectId(id_form_questions) ||
        !isValidObjectId(id_option)
    ) {
        return res
            .status(400)
            .json({ message: "Id de formulario, pregunta u opción inválido" });
    }

    try {
        const formGroup = await Form_Group.findById(id_form_group);

        if (!formGroup) {
            return res.status(404).json({ message: "Grupo de formulario no encontrado" });
        }

        const question = formGroup.preguntas.id(id_form_questions);

        if (!question) {
            return res.status(404).json({ message: "Pregunta no encontrada" });
        }

        const option = question.opciones.id(id_option);

        if (!option) {
            return res.status(404).json({ message: "Opción no encontrada" });
        }

        option.deleteOne();
        await formGroup.save();
        res.status(200).json(formGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getFormGroups,
    getFormGroupById,
    getFormGroupsByNegocio,
    postFormGroup,
    updateFormGroup,
    deleteFormGroup,
    postFormQuestions,
    updateFormQuestion,
    deleteFormQuestion,
    postOptions,
    updateOption,
    deleteOption,
};