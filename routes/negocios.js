var express = require('express');
var router = express.Router();
var negociosController = require('../controllers/negociosController');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/access.middleware');
const { PERMISSIONS } = require('../services/rbac.service');

/* GET users listing. */
router.get('/public', negociosController.getNegociosPublic);
router.get('/', requireAuth, requirePermissions([PERMISSIONS.NEGOCIOS_VIEW]), negociosController.getNegocios);
router.get('/:id/desfase', requireAuth, requirePermissions([PERMISSIONS.NEGOCIOS_VIEW]), negociosController.getDesfaseNegocio);
router.put('/:id/desfase', requireAuth, requirePermissions([PERMISSIONS.NEGOCIOS_MANAGE]), negociosController.updateDesfaseNegocio);
router.get('/:id', requireAuth, requirePermissions([PERMISSIONS.NEGOCIOS_VIEW]), negociosController.getNegocioById);
router.post('/', requireAuth, requirePermissions([PERMISSIONS.NEGOCIOS_MANAGE]), negociosController.createNegocio);
router.put('/:id', requireAuth, requirePermissions([PERMISSIONS.NEGOCIOS_MANAGE]), negociosController.updateNegocio);
router.delete('/:id', requireAuth, requirePermissions([PERMISSIONS.NEGOCIOS_MANAGE]), negociosController.deleteNegocio);

module.exports = router; 