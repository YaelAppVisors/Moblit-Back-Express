const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HallazgoSchema = new Schema(
    {
        id_registro_lista_verificacion: { // Folio — referencia al Request (lista de verificación)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Request',
            required: true
        },
        id_item: { // _id de la pregunta (QuestionAnwerSchema) dentro del Request
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        id_accion_correctiva: { // Descripción o referencia a la acción correctiva
            type: String,
            required: false,
            default: null
        },
        id_usuario_responsable: { // Usuario responsable de resolver el hallazgo
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        descripcion: {
            type: String,
            required: true
        },
        fecha_inicio: {
            type: Date,
            required: true
        },
        fecha_fin: {
            type: Date,
            required: false,
            default: null
        },
        imagenes: {
            type: [String], // Rutas de imágenes subidas
            required: false,
            default: []
        },
        estado: {
            type: String,
            required: true,
            enum: ['Pendiente', 'En proceso', 'Cerrado', 'Cancelado'],
            default: 'Pendiente'
        },
        activo: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Hallazgo = mongoose.model('Hallazgo', HallazgoSchema);

module.exports = Hallazgo;
