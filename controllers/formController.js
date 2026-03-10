const Negocios = require("../models/Negocios");
const mongoose = require("mongoose");
const Form = require("../models/Form");
const FormResponse = require("../models/FormResponse");

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

const isEmptyValue = (value) => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
};

const parseAsDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const findFieldDefinition = (form, fieldId) => {
    for (const group of form.grupos || []) {
        const field = (group.fields || []).id(fieldId);
        if (field) return { group, field };
    }
    return null;
};

const normalizeSelectedOptions = (field, value) => {
    const activeOptions = (field.opciones || []).filter((option) => option.activo !== false);
    const labelsMap = new Map(activeOptions.map((option) => [String(option.label), option]));

    if (field.fieldType === 'select' || field.fieldType === 'radio') {
        if (typeof value !== 'string') return { ok: false, error: 'Debe enviar texto para una opción única' };
        const option = labelsMap.get(value);
        if (!option) return { ok: false, error: 'La opción seleccionada no existe o está inactiva' };
        return {
            ok: true,
            selectedOptions: [{ optionId: option._id, label: option.label }],
        };
    }

    if (field.fieldType === 'checkbox' && Array.isArray(value)) {
        const selectedOptions = [];
        for (const selectedLabel of value) {
            if (typeof selectedLabel !== 'string') {
                return { ok: false, error: 'Cada opción seleccionada debe ser texto' };
            }
            const option = labelsMap.get(selectedLabel);
            if (!option) {
                return { ok: false, error: `La opción ${selectedLabel} no existe o está inactiva` };
            }
            selectedOptions.push({ optionId: option._id, label: option.label });
        }
        return { ok: true, selectedOptions };
    }

    return { ok: true, selectedOptions: [] };
};

const validateAnswerValueByField = (field, value) => {
    if (isEmptyValue(value)) return { ok: true };

    if (field.fieldType === 'text') {
        if (typeof value !== 'string') return { ok: false, error: 'Debe ser texto' };
        return { ok: true };
    }

    if (field.fieldType === 'number') {
        if (typeof value !== 'number' || Number.isNaN(value)) return { ok: false, error: 'Debe ser número' };
        if (field.validations?.min !== undefined && value < field.validations.min) {
            return { ok: false, error: `Debe ser mayor o igual a ${field.validations.min}` };
        }
        if (field.validations?.max !== undefined && value > field.validations.max) {
            return { ok: false, error: `Debe ser menor o igual a ${field.validations.max}` };
        }
        return { ok: true };
    }

    if (field.fieldType === 'date') {
        const date = parseAsDate(value);
        if (!date) return { ok: false, error: 'Debe ser una fecha válida' };
        return { ok: true };
    }

    if (field.fieldType === 'select' || field.fieldType === 'radio') {
        if (typeof value !== 'string') return { ok: false, error: 'Debe seleccionar una opción válida' };
        return { ok: true };
    }

    if (field.fieldType === 'checkbox') {
        if (typeof value === 'boolean') return { ok: true };
        if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return { ok: true };
        return { ok: false, error: 'Checkbox debe ser booleano o arreglo de textos' };
    }

    return { ok: true };
};

const parsePagination = (req) => {
    const pageRaw = Number(req.query.page);
    const limitRaw = Number(req.query.limit);

    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20;

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

const buildResponseFilters = (req) => {
    const { status, fromDate, toDate, user } = req.query;
    const filters = {};

    if (status !== undefined) {
        if (!['draft', 'submitted', 'cancelled'].includes(status)) {
            return { error: 'status inválido' };
        }
        filters.status = status;
    }

    if (user !== undefined) {
        if (!isValidObjectId(user)) {
            return { error: 'Id de usuario inválido en query' };
        }
        filters.user = user;
    }

    if (fromDate !== undefined || toDate !== undefined) {
        const dateFilter = {};
        if (fromDate !== undefined) {
            const parsedFrom = parseAsDate(fromDate);
            if (!parsedFrom) return { error: 'fromDate inválida' };
            dateFilter.$gte = parsedFrom;
        }
        if (toDate !== undefined) {
            const parsedTo = parseAsDate(toDate);
            if (!parsedTo) return { error: 'toDate inválida' };
            dateFilter.$lte = parsedTo;
        }
        filters.createdAt = dateFilter;
    }

    return { filters };
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
    const { tipo_servicio } = req.query;

    if (!isValidObjectId(id_negocio)) {
        return res.status(400).json({ message: "Id de negocio inválido" });
    }

    try {
        const query = { negocio: id_negocio };

        if (tipo_servicio) {
            query.tipo_servicio = tipo_servicio;
        }

        const forms = await Form.find(query).sort({ createdAt: -1 });
        
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getServiceTypes = async (req, res) => {
  try {
    const services = await Form.distinct("tipo_servicio");
    
    const filteredServices = services.filter(s => s != null && s !== "");
    
    res.status(200).json(filteredServices);
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

const updateForm = async (req, res) => {
    const { id_form } = req.params;
    const {
        nombre_formulario,
        tipo_servicio,
        activo,
        version,
        configuracion_respuesta,
    } = req.body;

    if (!isValidObjectId(id_form)) {
        return res.status(400).json({ message: "Id de formulario inválido" });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: "Formulario no encontrado" });

        if (nombre_formulario !== undefined) {
            const normalizedName = normalizeText(nombre_formulario);
            if (!normalizedName) {
                return res.status(400).json({ message: "nombre_formulario no puede estar vacío" });
            }
            form.nombre_formulario = normalizedName;
        }

        if (tipo_servicio !== undefined) {
            form.tipo_servicio = normalizeText(tipo_servicio);
        }

        if (activo !== undefined) {
            if (typeof activo !== 'boolean') {
                return res.status(400).json({ message: "activo debe ser booleano" });
            }
            form.activo = activo;
        }

        if (version !== undefined) {
            if (!Number.isInteger(version) || version < 1) {
                return res.status(400).json({ message: "version debe ser un entero mayor o igual a 1" });
            }
            form.version = version;
        }

        if (configuracion_respuesta !== undefined) {
            if (
                configuracion_respuesta === null ||
                typeof configuracion_respuesta !== 'object' ||
                Array.isArray(configuracion_respuesta)
            ) {
                return res.status(400).json({ message: "configuracion_respuesta debe ser un objeto" });
            }

            const currentConfig = form.configuracion_respuesta?.toObject
                ? form.configuracion_respuesta.toObject()
                : (form.configuracion_respuesta || {});

            const nextConfig = { ...currentConfig };

            if (configuracion_respuesta.acepta_respuestas !== undefined) {
                if (typeof configuracion_respuesta.acepta_respuestas !== 'boolean') {
                    return res.status(400).json({ message: "acepta_respuestas debe ser booleano" });
                }
                nextConfig.acepta_respuestas = configuracion_respuesta.acepta_respuestas;
            }

            if (configuracion_respuesta.permite_anonimo !== undefined) {
                if (typeof configuracion_respuesta.permite_anonimo !== 'boolean') {
                    return res.status(400).json({ message: "permite_anonimo debe ser booleano" });
                }
                nextConfig.permite_anonimo = configuracion_respuesta.permite_anonimo;
            }

            if (configuracion_respuesta.una_respuesta_por_usuario !== undefined) {
                if (typeof configuracion_respuesta.una_respuesta_por_usuario !== 'boolean') {
                    return res.status(400).json({ message: "una_respuesta_por_usuario debe ser booleano" });
                }
                nextConfig.una_respuesta_por_usuario = configuracion_respuesta.una_respuesta_por_usuario;
            }

            if (configuracion_respuesta.requiere_geolocalizacion !== undefined) {
                if (typeof configuracion_respuesta.requiere_geolocalizacion !== 'boolean') {
                    return res.status(400).json({ message: "requiere_geolocalizacion debe ser booleano" });
                }
                nextConfig.requiere_geolocalizacion = configuracion_respuesta.requiere_geolocalizacion;
            }

            if (configuracion_respuesta.limite_total_respuestas !== undefined) {
                if (
                    configuracion_respuesta.limite_total_respuestas !== null &&
                    (typeof configuracion_respuesta.limite_total_respuestas !== 'number' || configuracion_respuesta.limite_total_respuestas < 0)
                ) {
                    return res.status(400).json({ message: "limite_total_respuestas debe ser número mayor o igual a 0" });
                }
                nextConfig.limite_total_respuestas = configuracion_respuesta.limite_total_respuestas === null
                    ? undefined
                    : configuracion_respuesta.limite_total_respuestas;
            }

            if (configuracion_respuesta.fecha_inicio !== undefined) {
                if (configuracion_respuesta.fecha_inicio === null) {
                    nextConfig.fecha_inicio = undefined;
                } else {
                    const parsedStart = parseAsDate(configuracion_respuesta.fecha_inicio);
                    if (!parsedStart) return res.status(400).json({ message: "fecha_inicio inválida" });
                    nextConfig.fecha_inicio = parsedStart;
                }
            }

            if (configuracion_respuesta.fecha_cierre !== undefined) {
                if (configuracion_respuesta.fecha_cierre === null) {
                    nextConfig.fecha_cierre = undefined;
                } else {
                    const parsedEnd = parseAsDate(configuracion_respuesta.fecha_cierre);
                    if (!parsedEnd) return res.status(400).json({ message: "fecha_cierre inválida" });
                    nextConfig.fecha_cierre = parsedEnd;
                }
            }

            form.configuracion_respuesta = nextConfig;
        }

        await form.save();
        return res.status(200).json(form);
    } catch (error) {
        return res.status(400).json({ message: error.message });
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

// ==========================================
// 5. RESPUESTAS DE FORMULARIOS
// ==========================================

const postFormResponse = async (req, res) => {
    const { id_form } = req.params;
    const {
        user,
        answers,
        status = 'submitted',
        submitChannel = 'WEB',
        metadata,
        startedAt,
        submittedAt,
    } = req.body;

    if (!isValidObjectId(id_form)) {
        return res.status(400).json({ message: 'Id de formulario inválido' });
    }

    if (user !== undefined && user !== null && !isValidObjectId(user)) {
        return res.status(400).json({ message: 'Id de usuario inválido' });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'answers debe ser un arreglo con al menos un elemento' });
    }

    if (!['draft', 'submitted', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'status inválido' });
    }

    if (!['WEB', 'MOVIL'].includes(submitChannel)) {
        return res.status(400).json({ message: 'submitChannel inválido' });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: 'Formulario no encontrado' });

        if (!form.activo) {
            return res.status(400).json({ message: 'El formulario está inactivo' });
        }

        const config = form.configuracion_respuesta || {};
        const now = new Date();

        if (config.acepta_respuestas === false && status === 'submitted') {
            return res.status(400).json({ message: 'Este formulario no acepta respuestas actualmente' });
        }

        if (config.fecha_inicio && now < new Date(config.fecha_inicio)) {
            return res.status(400).json({ message: 'El formulario aún no está disponible para responder' });
        }

        if (config.fecha_cierre && now > new Date(config.fecha_cierre)) {
            return res.status(400).json({ message: 'El formulario ya no recibe respuestas' });
        }

        if (config.permite_anonimo === false && !user) {
            return res.status(400).json({ message: 'Este formulario requiere un usuario autenticado' });
        }

        if (config.requiere_geolocalizacion === true) {
            const hasLocation = metadata?.location?.latitude && metadata?.location?.longitude;
            if (!hasLocation) {
                return res.status(400).json({ message: 'Este formulario requiere geolocalización' });
            }
        }

        if (config.limite_total_respuestas !== undefined && config.limite_total_respuestas !== null && status === 'submitted') {
            const totalSubmitted = await FormResponse.countDocuments({ form: form._id, status: 'submitted' });
            if (totalSubmitted >= config.limite_total_respuestas) {
                return res.status(400).json({ message: 'Se alcanzó el límite total de respuestas para este formulario' });
            }
        }

        if (config.una_respuesta_por_usuario === true && user && status === 'submitted') {
            const existingResponse = await FormResponse.findOne({ form: form._id, user, status: 'submitted' });
            if (existingResponse) {
                return res.status(409).json({ message: 'El usuario ya envió una respuesta para este formulario' });
            }
        }

        const normalizedAnswers = [];
        const receivedFieldIds = new Set();

        for (const answer of answers) {
            const fieldId = answer?.fieldId;

            if (!fieldId || !isValidObjectId(fieldId)) {
                return res.status(400).json({ message: 'Cada respuesta debe incluir un fieldId válido' });
            }

            const fieldIdStr = String(fieldId);
            if (receivedFieldIds.has(fieldIdStr)) {
                return res.status(400).json({ message: `fieldId duplicado en answers: ${fieldIdStr}` });
            }
            receivedFieldIds.add(fieldIdStr);

            const fieldFound = findFieldDefinition(form, fieldId);
            if (!fieldFound) {
                return res.status(400).json({ message: `El fieldId ${fieldIdStr} no existe en el formulario` });
            }

            const { group, field } = fieldFound;
            if (group.activo === false || field.activo === false) {
                return res.status(400).json({ message: `El campo ${field.label} está inactivo` });
            }

            const value = answer.value;
            const fieldRequired = field.required === true || field.validations?.required === true;
            if (fieldRequired && isEmptyValue(value)) {
                return res.status(400).json({ message: `El campo ${field.label} es obligatorio` });
            }

            const typeValidation = validateAnswerValueByField(field, value);
            if (!typeValidation.ok) {
                return res.status(400).json({ message: `Campo ${field.label}: ${typeValidation.error}` });
            }

            const optionNormalization = normalizeSelectedOptions(field, value);
            if (!optionNormalization.ok) {
                return res.status(400).json({ message: `Campo ${field.label}: ${optionNormalization.error}` });
            }

            normalizedAnswers.push({
                groupId: group._id,
                groupName: group.nombre_grupo,
                fieldId: field._id,
                fieldName: field.name,
                fieldLabel: field.label,
                fieldType: field.fieldType,
                value,
                selectedOptions: optionNormalization.selectedOptions,
                required: fieldRequired,
                valid: true,
            });
        }

        for (const group of form.grupos || []) {
            if (group.activo === false) continue;

            for (const field of group.fields || []) {
                if (field.activo === false) continue;
                const fieldRequired = field.required === true || field.validations?.required === true;
                if (!fieldRequired) continue;

                if (!receivedFieldIds.has(String(field._id))) {
                    return res.status(400).json({ message: `Falta responder el campo obligatorio ${field.label}` });
                }
            }
        }

        const payload = {
            form: form._id,
            negocio: form.negocio,
            user: user || undefined,
            status,
            answers: normalizedAnswers,
            formSnapshot: {
                nombre_formulario: form.nombre_formulario,
                tipo_servicio: form.tipo_servicio,
                version: form.version || 1,
            },
            submitChannel,
            metadata,
            startedAt: parseAsDate(startedAt) || new Date(),
            submittedAt: status === 'submitted' ? parseAsDate(submittedAt) || new Date() : undefined,
        };

        const newResponse = new FormResponse(payload);
        await newResponse.save();

        return res.status(201).json(newResponse);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const getFormResponsesByForm = async (req, res) => {
    const { id_form } = req.params;

    if (!isValidObjectId(id_form)) {
        return res.status(400).json({ message: 'Id de formulario inválido' });
    }

    const { page, limit, skip } = parsePagination(req);
    const { filters, error } = buildResponseFilters(req);
    if (error) {
        return res.status(400).json({ message: error });
    }

    try {
        const form = await Form.findById(id_form);
        if (!form) return res.status(404).json({ message: 'Formulario no encontrado' });

        const query = { form: id_form, ...filters };
        const [items, total] = await Promise.all([
            FormResponse.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'username email perfil')
                .populate('negocio', 'nombre_negocio sector')
                .populate('form', 'nombre_formulario tipo_servicio version'),
            FormResponse.countDocuments(query),
        ]);

        return res.status(200).json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getFormResponsesByNegocio = async (req, res) => {
    const { id_negocio } = req.params;

    if (!isValidObjectId(id_negocio)) {
        return res.status(400).json({ message: 'Id de negocio inválido' });
    }

    const { page, limit, skip } = parsePagination(req);
    const { filters, error } = buildResponseFilters(req);
    if (error) {
        return res.status(400).json({ message: error });
    }

    try {
        const negocio = await Negocios.findById(id_negocio);
        if (!negocio) return res.status(404).json({ message: 'Negocio no encontrado' });

        const query = { negocio: id_negocio, ...filters };
        const [items, total] = await Promise.all([
            FormResponse.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'username email perfil')
                .populate('negocio', 'nombre_negocio sector')
                .populate('form', 'nombre_formulario tipo_servicio version'),
            FormResponse.countDocuments(query),
        ]);

        return res.status(200).json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getFormResponseById = async (req, res) => {
    const { id_response } = req.params;

    if (!isValidObjectId(id_response)) {
        return res.status(400).json({ message: 'Id de respuesta inválido' });
    }

    try {
        const response = await FormResponse.findById(id_response)
            .populate('user', 'username email perfil')
            .populate('negocio', 'nombre_negocio sector')
            .populate('form', 'nombre_formulario tipo_servicio version');

        if (!response) {
            return res.status(404).json({ message: 'Respuesta no encontrada' });
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const cancelFormResponse = async (req, res) => {
    const { id_response } = req.params;

    if (!isValidObjectId(id_response)) {
        return res.status(400).json({ message: 'Id de respuesta inválido' });
    }

    try {
        const response = await FormResponse.findById(id_response);
        if (!response) {
            return res.status(404).json({ message: 'Respuesta no encontrada' });
        }

        if (response.status === 'cancelled') {
            return res.status(200).json(response);
        }

        response.status = 'cancelled';
        response.submittedAt = undefined;
        await response.save();

        return res.status(200).json(response);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getForms,
    getFormById,
    getFormsByNegocio,
    postForm,
    updateForm,
    postFormGroup,
    updateFormGroup,
    postFormField,
    postFormFieldsBulk,
    updateFormField,
    deleteFormField,
    postOption,
    updateOption,
    postFormResponse,
    getFormResponsesByForm,
    getFormResponsesByNegocio,
    getFormResponseById,
    cancelFormResponse,
    getServiceTypes,

};