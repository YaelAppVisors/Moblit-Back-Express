const express = require('express');
const router = express.Router();
const hallazgosController = require('../controllers/hallazgosController');
const upload = require('../middlewares/upload.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/access.middleware');
const { PERMISSIONS } = require('../services/rbac.service');

router.use(requireAuth);

// Rutas específicas primero para evitar conflictos con /:id
router.get('/request/:requestId', requirePermissions([PERMISSIONS.HALLAZGOS_VIEW]), hallazgosController.getHallazgosByRequest);
router.get('/usuario/:usuarioId', requirePermissions([PERMISSIONS.HALLAZGOS_VIEW]), hallazgosController.getHallazgosByUsuario);

router.post('/', requirePermissions([PERMISSIONS.HALLAZGOS_CREATE]), upload.array('imagenes', 10), hallazgosController.createHallazgo);
router.get('/', requirePermissions([PERMISSIONS.HALLAZGOS_VIEW]), hallazgosController.getAllHallazgos);
router.get('/:id', requirePermissions([PERMISSIONS.HALLAZGOS_VIEW]), hallazgosController.getHallazgoById);
router.put('/:id', requirePermissions([PERMISSIONS.HALLAZGOS_UPDATE]), upload.array('imagenes', 10), hallazgosController.updateHallazgo);
router.delete('/:id', requirePermissions([PERMISSIONS.HALLAZGOS_DELETE]), hallazgosController.deleteHallazgo);

module.exports = router;
