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

const validateFieldType = (fieldType) =>
    ['text', 'number', 'select', 'checkbox', 'date', 'radio'].includes(fieldType);

const normalizeFieldPayload = (payload = {}) => ({
    label: normalizeText(payload.label),
    name: normalizeText(payload.name),
    fieldType: normalizeText(payload.fieldType),
    placeholder: payload.placeholder !== undefined ? normalizeText(payload.placeholder) : undefined,
    allowMultiOption: payload.allowMultiOption,
    validations: payload.validations,
    required: payload.required,
    activo: payload.activo,
    opciones: payload.opciones,
});

const isValidFieldPayload = (field) => {
    if (!field.label || !field.name || !field.fieldType) return false;
    if (!validateFieldType(field.fieldType)) return false;
    if (field.allowMultiOption !== undefined && typeof field.allowMultiOption !== 'boolean') return false;
    if (field.required !== undefined && typeof field.required !== 'boolean') return false;
    if (field.activo !== undefined && typeof field.activo !== 'boolean') return false;
    if (field.validations !== undefined && typeof field.validations !== 'object') return false;
    if (field.opciones !== undefined && !Array.isArray(field.opciones)) return false;
    if (Array.isArray(field.opciones) && !field.opciones.every((opt) => opt && typeof opt.label === 'string')) return false;
    return true;
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
    const normalizedField = normalizeFieldPayload(req.body);

    if (!isValidObjectId(id_form) || !isValidObjectId(id_group)) return res.status(400).json({ message: "Ids inválidos" });
    if (!isValidFieldPayload(normalizedField)) {
        return res.status(400).json({ message: "Field inválido: verifica label, name, fieldType y tipos de propiedades" });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        const group = form.grupos.id(id_group);
        if (!group) return res.status(404).json({ message: "Grupo no encontrado" });

        group.fields.push(normalizedField);

        await form.save();
        res.status(201).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const postFormFieldsBulk = async (req, res) => {
    const { id_form, id_group } = req.params;
    const { fields } = req.body;

    if (!isValidObjectId(id_form) || !isValidObjectId(id_group)) return res.status(400).json({ message: "Ids inválidos" });
    if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: "fields debe ser un arreglo con al menos un elemento" });
    }

    const normalizedFields = fields.map((field) => normalizeFieldPayload(field));
    if (!normalizedFields.every(isValidFieldPayload)) {
        return res.status(400).json({ message: "Uno o más fields son inválidos" });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        const group = form.grupos.id(id_group);
        if (!group) return res.status(404).json({ message: "Grupo no encontrado" });

        group.fields.push(...normalizedFields);

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
        if (fieldType !== undefined) {
            const normalizedFieldType = normalizeText(fieldType);
            if (!validateFieldType(normalizedFieldType)) {
                return res.status(400).json({ message: "fieldType inválido" });
            }
            field.fieldType = normalizedFieldType;
        }
        if (placeholder !== undefined) field.placeholder = normalizeText(placeholder);
        if (activo !== undefined && typeof activo !== 'boolean') return res.status(400).json({ message: "activo debe ser booleano" });
        if (activo !== undefined) field.activo = activo;
        if (allowMultiOption !== undefined && typeof allowMultiOption !== 'boolean') return res.status(400).json({ message: "allowMultiOption debe ser booleano" });
        if (allowMultiOption !== undefined) field.allowMultiOption = allowMultiOption;
        if (validations !== undefined && typeof validations !== 'object') return res.status(400).json({ message: "validations debe ser un objeto" });
        if (validations !== undefined) field.validations = validations;
        if (required !== undefined && typeof required !== 'boolean') return res.status(400).json({ message: "required debe ser booleano" });
        if (required !== undefined) field.required = required;

        await form.save();
        res.status(200).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteFormField = async (req, res) => {
    const { id_form, id_group, id_field } = req.params;

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

        field.deleteOne();

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
    postFormFieldsBulk,
    updateFormField,
    deleteFormField,
    postOption,
    updateOption
};