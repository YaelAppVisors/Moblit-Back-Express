var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');
const upload = require('../middlewares/upload.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/access.middleware');
const { PERMISSIONS } = require('../services/rbac.service');

/* GET users listing. */
router.post('/', upload.single('avatar'), userController.createUser);
router.post('/login', userController.loginUser);
router.get('/', requireAuth, requirePermissions([PERMISSIONS.USERS_VIEW]), userController.getUsers);
router.get('/:id', requireAuth, requirePermissions([PERMISSIONS.USERS_VIEW]), userController.getUserById);
router.put('/:id', requireAuth, requirePermissions([PERMISSIONS.USERS_UPDATE]), upload.single('avatar'), userController.updateUser);
router.put('/putlocation/:id', requireAuth, requirePermissions([PERMISSIONS.USERS_UPDATE]), userController.putUserLocation);
router.delete('/:id', requireAuth, requirePermissions([PERMISSIONS.USERS_DELETE]), userController.deleteUser);

module.exports = router;
