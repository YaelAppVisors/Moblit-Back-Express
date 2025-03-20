var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');

/* GET users listing. */
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/putlocation/:id', userController.putUserLocation);

module.exports = router;
