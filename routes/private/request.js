const express = require('express');
const router = express.Router();
const requestController = require('../../controllers/requestController');

router.post('/', requestController.CreateRequest);
router.put('/:id', requestController.updateRequest);
router.delete('/:id', requestController.deleteRequest);
router.get('/', requestController.getAllRequest);
router.get('/:id/pdf', requestController.generatePdf);
router.get('/:id', requestController.getRequestById);
router.get('/assigned/:id', requestController.getRequestByAssignedTo);
router.get('/negocio/:id', requestController.getRequestByNegocio);

module.exports = router;