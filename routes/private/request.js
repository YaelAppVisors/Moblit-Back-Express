const express = require('express');
const router = express.Router();
const requestController = require('../../controllers/requestController');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requirePermissions } = require('../../middlewares/access.middleware');
const { PERMISSIONS } = require('../../services/rbac.service');

router.use(requireAuth);

router.post('/', requirePermissions([PERMISSIONS.REQUEST_CREATE]), requestController.CreateRequest);
router.put('/:id/status', requirePermissions([PERMISSIONS.REQUEST_UPDATE]), requestController.updateRequestStatus);
router.put('/:id', requirePermissions([PERMISSIONS.REQUEST_UPDATE]), requestController.updateRequest);
router.delete('/:id', requirePermissions([PERMISSIONS.REQUEST_DELETE]), requestController.deleteRequest);
router.get('/', requirePermissions([PERMISSIONS.REQUEST_VIEW]), requestController.getAllRequest);
router.get('/:id/pdf', requirePermissions([PERMISSIONS.REQUEST_VIEW, PERMISSIONS.REPORTS_GENERATE], { anyOf: true }), requestController.generatePdf);
router.get('/:id', requirePermissions([PERMISSIONS.REQUEST_VIEW]), requestController.getRequestById);
router.get('/assigned/:id', requirePermissions([PERMISSIONS.REQUEST_VIEW]), requestController.getRequestByAssignedTo);
router.get('/negocio/:id', requirePermissions([PERMISSIONS.REQUEST_VIEW]), requestController.getRequestByNegocio);

module.exports = router;