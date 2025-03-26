var express = require('express');
var router = express.Router();
var negociosController = require('../controllers/negociosController');

/* GET users listing. */
router.get('/', negociosController.getNegocios);
router.post('/', negociosController.createNegocio);

module.exports = router;