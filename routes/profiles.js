const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requirePermissions } = require("../middlewares/access.middleware");
const { PERMISSIONS } = require("../services/rbac.service");

router.use(requireAuth);

router.get(
  "/",
  requirePermissions([PERMISSIONS.PROFILES_VIEW]),
  profileController.getProfiles
);
router.get(
  "/catalogo/default",
  requirePermissions([PERMISSIONS.PROFILES_VIEW]),
  profileController.getDefaultPermissionCatalog
);
router.post(
  "/",
  requirePermissions([PERMISSIONS.PROFILES_MANAGE]),
  profileController.createProfile
);
router.put(
  "/:id",
  requirePermissions([PERMISSIONS.PROFILES_MANAGE]),
  profileController.updateProfile
);
router.delete(
  "/:id",
  requirePermissions([PERMISSIONS.PROFILES_MANAGE]),
  profileController.deleteProfile
);
router.put(
  "/assign/:userId",
  requirePermissions([PERMISSIONS.PROFILES_MANAGE]),
  profileController.assignProfileToUser
);

module.exports = router;
