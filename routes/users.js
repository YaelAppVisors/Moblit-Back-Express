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

// Rutas para el perfil del usuario autenticado (deben ir antes de /:id)
router.get('/me', requireAuth, userController.getOwnProfile);
router.put('/me', requireAuth, userController.updateOwnProfile);
router.put('/me/avatar', requireAuth, upload.single('avatar'), userController.updateOwnAvatar);

// Rutas de administración (requieren permisos)
router.get('/', requireAuth, requirePermissions([PERMISSIONS.USERS_VIEW]), userController.getUsers);
router.get('/ubications', userController.getUbications);
router.get('/:id', requireAuth, requirePermissions([PERMISSIONS.USERS_VIEW]), userController.getUserById);
router.put('/:id', requireAuth, requirePermissions([PERMISSIONS.USERS_UPDATE]), upload.single('avatar'), userController.updateUser);
router.put('/putlocation/:id', userController.putUserLocation);
router.delete('/:id', requireAuth, requirePermissions([PERMISSIONS.USERS_DELETE]), userController.deleteUser);

module.exports = router;
