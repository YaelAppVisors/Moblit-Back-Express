const Negocios = require("../models/Negocios");
const mongoose = require("mongoose");
const Form = require("../models/Form");

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

// ==========================================
// 1. GESTIÓN DE FORMULARIOS
// ==========================================

const getForms = async (req, res) => {
    try {
        const forms = await Form.find().sort({ createdAt: -1 });
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFormById = async (req, res) => {
    const { id_form } = req.params;

    if (!isValidObjectId(id_form)) {
        return res.status(400).json({ message: "Id de formulario inválido" });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });
        res.status(200).json(form);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFormsByNegocio = async (req, res) => {
    const { id_negocio } = req.params;

    if (!isValidObjectId(id_negocio)) {
        return res.status(400).json({ message: "Id de negocio inválido" });
    }

    try {
        const forms = await Form.find({ negocio: id_negocio }).sort({ createdAt: -1 });
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postForm = async (req, res) => {
    const { id_negocio } = req.params;
    const nombre_formulario = normalizeText(req.body.nombre_formulario);

    if (!isValidObjectId(id_negocio)) {
        return res.status(400).json({ message: "Id de negocio inválido" });
    }

    if (!nombre_formulario) {
        return res.status(400).json({ message: "nombre_formulario es obligatorio" });
    }

    try {
        const negocio = await Negocios.findById(id_negocio);
        if (!negocio) return res.status(404).json({ message: "Negocio no encontrado" });

        const newForm = new Form({ nombre_formulario, negocio: id_negocio, grupos: [] });
        await newForm.save();

        if (!Array.isArray(negocio.formularios)) negocio.formularios = [];
        negocio.formularios.push(newForm._id);
        await negocio.save();

        res.status(201).json(newForm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ==========================================
// 2. GESTIÓN DE GRUPOS
// ==========================================

const postFormGroup = async (req, res) => {
    const { id_form } = req.params;
    const nombre_grupo = normalizeText(req.body.nombre_grupo);
    const ordenNumber = Number(req.body.orden);

    if (!isValidObjectId(id_form)) return res.status(400).json({ message: "Id de formulario inválido" });
    if (!nombre_grupo || Number.isNaN(ordenNumber)) return res.status(400).json({ message: "nombre_grupo y orden son obligatorios" });

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        form.grupos.push({ nombre_grupo, orden: ordenNumber, fields: [] });
        await form.save();
        
        res.status(201).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateFormGroup = async (req, res) => {
    const { id_form, id_group } = req.params;
    const nombre_grupo = normalizeOptionalText(req.body.nombre_grupo);
    const ordenNumber = parseOptionalNumber(req.body.orden);
    const { activo } = req.body;

    if (!isValidObjectId(id_form) || !isValidObjectId(id_group)) return res.status(400).json({ message: "Ids inválidos" });

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        const group = form.grupos.id(id_group);
        if (!group) return res.status(404).json({ message: "Grupo no encontrado" });

        if (nombre_grupo !== undefined) group.nombre_grupo = nombre_grupo;
        if (ordenNumber !== null && ordenNumber !== undefined) group.orden = ordenNumber;
        if (activo !== undefined) group.activo = activo;

        await form.save();
        res.status(200).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ==========================================
// 3. GESTIÓN DE CAMPOS (FIELDS)
// ==========================================

const postFormField = async (req, res) => {
    const { id_form, id_group } = req.params;
    const label = normalizeText(req.body.label);
    const name = normalizeText(req.body.name);
    const fieldType = normalizeText(req.body.fieldType);
    const { placeholder, allowMultiOption, validations, required } = req.body;

    if (!isValidObjectId(id_form) || !isValidObjectId(id_group)) return res.status(400).json({ message: "Ids inválidos" });
    if (!label || !name || !fieldType) return res.status(400).json({ message: "label, name y fieldType son obligatorios" });

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        const group = form.grupos.id(id_group);
        if (!group) return res.status(404).json({ message: "Grupo no encontrado" });

        group.fields.push({
            label, name, fieldType, placeholder, allowMultiOption, validations, required
        });

        await form.save();
        res.status(201).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateFormField = async (req, res) => {
    const { id_form, id_group, id_field } = req.params;
    const { label, name, fieldType, placeholder, activo, allowMultiOption, validations, required } = req.body;

    if (!isValidObjectId(id_form) || !isValidObjectId(id_group) || !isValidObjectId(id_field)) {
        return res.status(400).json({ message: "Ids inválidos" });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        const group = form.grupos.id(id_group);
        if (!group) return res.status(404).json({ message: "Grupo no encontrado" });

        const field = group.fields.id(id_field);
        if (!field) return res.status(404).json({ message: "Campo no encontrado" });

        if (label !== undefined) field.label = normalizeText(label);
        if (name !== undefined) field.name = normalizeText(name);
        if (fieldType !== undefined) field.fieldType = normalizeText(fieldType);
        if (placeholder !== undefined) field.placeholder = normalizeText(placeholder);
        if (activo !== undefined) field.activo = activo;
        if (allowMultiOption !== undefined) field.allowMultiOption = allowMultiOption;
        if (validations !== undefined) field.validations = validations;
        if (required !== undefined) field.required = required;

        await form.save();
        res.status(200).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ==========================================
// 4. GESTIÓN DE OPCIONES
// ==========================================

const postOption = async (req, res) => {
    const { id_form, id_group, id_field } = req.params;
    const label = normalizeText(req.body.label);

    if (!isValidObjectId(id_form) || !isValidObjectId(id_group) || !isValidObjectId(id_field)) {
        return res.status(400).json({ message: "Ids inválidos" });
    }
    if (!label) return res.status(400).json({ message: "label es obligatorio" });

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        const field = form.grupos.id(id_group)?.fields.id(id_field);
        if (!field) return res.status(404).json({ message: "Grupo o Campo no encontrado" });

        field.opciones.push({ label });
        await form.save();
        res.status(201).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateOption = async (req, res) => {
    const { id_form, id_group, id_field, id_option } = req.params;
    const label = normalizeOptionalText(req.body.label);
    const { activo } = req.body;

    if (!isValidObjectId(id_form) || !isValidObjectId(id_group) || !isValidObjectId(id_field) || !isValidObjectId(id_option)) {
        return res.status(400).json({ message: "Ids inválidos" });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        const option = form.grupos.id(id_group)?.fields.id(id_field)?.opciones.id(id_option);
        if (!option) return res.status(404).json({ message: "Ruta de opción no encontrada" });

        if (label !== undefined) option.label = label;
        if (activo !== undefined) option.activo = activo;

        await form.save();
        res.status(200).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getForms,
    getFormById,
    getFormsByNegocio,
    postForm,
    postFormGroup,
    updateFormGroup,
    postFormField,
    updateFormField,
    postOption,
    updateOption
};