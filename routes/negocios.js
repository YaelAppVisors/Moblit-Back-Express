var express = require('express');
var router = express.Router();
var negociosController = require('../controllers/negociosController');

/* GET users listing. */
router.get('/', negociosController.getNegocios);
router.get('/:id', negociosController.getNegocioById);
router.post('/', negociosController.createNegocio);
router.put('/:id', negociosController.updateNegocio);
router.delete('/:id', negociosController.deleteNegocio);

module.exports = router;