var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');

/* GET users listing. */
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/:id', userController.updateUser);
router.put('/putlocation/:id', userController.putUserLocation);
router.delete('/:id', userController.deleteUser);

module.exports = router;
