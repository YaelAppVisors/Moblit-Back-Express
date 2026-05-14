const Hallazgo = require('../models/Hallazgo');
const Request = require('../models/Request');
const mongoose = require('mongoose');

// Populate común para todos los queries
const defaultPopulate = [
    { path: 'id_registro_lista_verificacion', select: 'requestHeader.ticket requestHeader.clientData requestHeader.serviceType' },
    { path: 'id_usuario_responsable', select: '-password' }
];

/**
 * POST /hallazgos
 * Crear un nuevo hallazgo vinculado a un Request y a un item (pregunta) específico
 */
exports.createHallazgo = async (req, res) => {
    const {
        id_registro_lista_verificacion,
        id_item,
        id_accion_correctiva,
        id_usuario_responsable,
        descripcion,
        fecha_inicio,
        fecha_fin,
        estado
    } = req.body;

    if (!id_registro_lista_verificacion) {
        return res.status(400).json({ message: 'El folio del registro (id_registro_lista_verificacion) es requerido' });
    }
    if (!id_item) {
        return res.status(400).json({ message: 'El item (pregunta) es requerido' });
    }
    if (!id_usuario_responsable) {
        return res.status(400).json({ message: 'El usuario responsable es requerido' });
    }
    if (!descripcion) {
        return res.status(400).json({ message: 'La descripción es requerida' });
    }
    if (!fecha_inicio) {
        return res.status(400).json({ message: 'La fecha de inicio es requerida' });
    }

    try {
        // Verificar que el Request existe
        const request = await Request.findById(id_registro_lista_verificacion);
        if (!request) {
            return res.status(404).json({ message: 'El registro (Request) no existe' });
        }

        // Verificar que el id_item existe dentro del Request
        const itemExists = request.requestResponse?.grupos?.some(grupo =>
            grupo.fields?.some(field => field._id.toString() === id_item.toString())
        );
        if (!itemExists) {
            return res.status(404).json({ message: 'El item (pregunta) no existe en el registro indicado' });
        }

        // Imágenes subidas via multer (campo "imagenes")
        const imagenes = req.files ? req.files.map(f => f.path) : [];

        const hallazgo = new Hallazgo({
            id_registro_lista_verificacion,
            id_item,
            id_accion_correctiva: id_accion_correctiva || null,
            id_usuario_responsable,
            descripcion,
            fecha_inicio,
            fecha_fin: fecha_fin || null,
            imagenes,
            estado: estado || 'Pendiente'
        });

        await hallazgo.save();

        const populated = await Hallazgo.findById(hallazgo._id).populate(defaultPopulate);
        return res.status(201).json({ message: 'Hallazgo creado con éxito', data: populated });
    } catch (error) {
        return res.status(500).json({ message: error?.message });
    }
};

/**
 * GET /hallazgos
 * Obtener todos los hallazgos activos
 */
exports.getAllHallazgos = async (req, res) => {
    try {
        const hallazgos = await Hallazgo.find({ activo: true })
            .populate(defaultPopulate)
            .sort({ createdAt: -1 });
        return res.status(200).json({ message: 'Hallazgos obtenidos', data: hallazgos });
    } catch (error) {
        return res.status(500).json({ message: error?.message });
    }
};

/**
 * GET /hallazgos/:id
 * Obtener un hallazgo por su ID
 */
exports.getHallazgoById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    try {
        const hallazgo = await Hallazgo.findOne({ _id: id, activo: true }).populate(defaultPopulate);
        if (!hallazgo) {
            return res.status(404).json({ message: 'Hallazgo no encontrado' });
        }
        return res.status(200).json({ message: 'Hallazgo encontrado', data: hallazgo });
    } catch (error) {
        return res.status(500).json({ message: error?.message });
    }
};

/**
 * GET /hallazgos/request/:requestId
 * Obtener todos los hallazgos de un Request específico (por folio/registro)
 */
exports.getHallazgosByRequest = async (req, res) => {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ message: 'ID de request inválido' });
    }

    try {
        const hallazgos = await Hallazgo.find({
            id_registro_lista_verificacion: requestId,
            activo: true
        })
            .populate(defaultPopulate)
            .sort({ createdAt: -1 });
        return res.status(200).json({ message: 'Hallazgos del request obtenidos', data: hallazgos });
    } catch (error) {
        return res.status(500).json({ message: error?.message });
    }
};

/**
 * GET /hallazgos/usuario/:usuarioId
 * Obtener todos los hallazgos asignados a un usuario responsable
 */
exports.getHallazgosByUsuario = async (req, res) => {
    const { usuarioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    try {
        const hallazgos = await Hallazgo.find({
            id_usuario_responsable: usuarioId,
            activo: true
        })
            .populate(defaultPopulate)
            .sort({ createdAt: -1 });
        return res.status(200).json({ message: 'Hallazgos del usuario obtenidos', data: hallazgos });
    } catch (error) {
        return res.status(500).json({ message: error?.message });
    }
};

/**
 * PUT /hallazgos/:id
 * Actualizar un hallazgo (descripción, estado, fechas, acción correctiva, usuario responsable)
 */
exports.updateHallazgo = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    const {
        id_accion_correctiva,
        id_usuario_responsable,
        descripcion,
        fecha_inicio,
        fecha_fin,
        estado
    } = req.body;

    const estadosValidos = ['Pendiente', 'En proceso', 'Cerrado', 'Cancelado'];
    if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({ message: `Estado inválido. Los valores permitidos son: ${estadosValidos.join(', ')}` });
    }

    try {
        const hallazgo = await Hallazgo.findOne({ _id: id, activo: true });
        if (!hallazgo) {
            return res.status(404).json({ message: 'Hallazgo no encontrado' });
        }

        if (id_accion_correctiva !== undefined) hallazgo.id_accion_correctiva = id_accion_correctiva;
        if (id_usuario_responsable) hallazgo.id_usuario_responsable = id_usuario_responsable;
        if (descripcion) hallazgo.descripcion = descripcion;
        if (fecha_inicio) hallazgo.fecha_inicio = fecha_inicio;
        if (fecha_fin !== undefined) hallazgo.fecha_fin = fecha_fin;
        if (estado) hallazgo.estado = estado;

        // Si se suben nuevas imágenes, se agregan al array existente
        if (req.files && req.files.length > 0) {
            const nuevasImagenes = req.files.map(f => f.path);
            hallazgo.imagenes = [...hallazgo.imagenes, ...nuevasImagenes];
        }

        await hallazgo.save();

        const populated = await Hallazgo.findById(hallazgo._id).populate(defaultPopulate);
        return res.status(200).json({ message: 'Hallazgo actualizado con éxito', data: populated });
    } catch (error) {
        return res.status(500).json({ message: error?.message });
    }
};

/**
 * DELETE /hallazgos/:id
 * Eliminar (soft delete) un hallazgo
 */
exports.deleteHallazgo = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    try {
        const hallazgo = await Hallazgo.findOneAndUpdate(
            { _id: id, activo: true },
            { activo: false },
            { new: true }
        );
        if (!hallazgo) {
            return res.status(404).json({ message: 'Hallazgo no encontrado' });
        }
        return res.status(200).json({ message: 'Hallazgo eliminado con éxito' });
    } catch (error) {
        return res.status(500).json({ message: error?.message });
    }
};
