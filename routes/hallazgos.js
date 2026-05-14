const express = require('express');
const router = express.Router();
const hallazgosController = require('../controllers/hallazgosController');
const upload = require('../middlewares/upload.middleware');

// Rutas específicas primero para evitar conflictos con /:id
router.get('/request/:requestId', hallazgosController.getHallazgosByRequest);
router.get('/usuario/:usuarioId', hallazgosController.getHallazgosByUsuario);

router.post('/', upload.array('imagenes', 10), hallazgosController.createHallazgo);
router.get('/', hallazgosController.getAllHallazgos);
router.get('/:id', hallazgosController.getHallazgoById);
router.put('/:id', upload.array('imagenes', 10), hallazgosController.updateHallazgo);
router.delete('/:id', hallazgosController.deleteHallazgo);

module.exports = router;
