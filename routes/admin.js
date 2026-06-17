const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requirePermissions } = require("../middlewares/access.middleware");
const { PERMISSIONS } = require("../services/rbac.service");

router.use(requireAuth);

router.get(
  "/dashboard",
  requirePermissions([PERMISSIONS.ADMIN_DASHBOARD]),
  adminController.getDashboard
);
router.get(
  "/auditoria",
  requirePermissions([PERMISSIONS.ADMIN_DASHBOARD]),
  adminController.getAuditLogs
);
router.put(
  "/usuarios/:id/status",
  requirePermissions([PERMISSIONS.ADMIN_USERS]),
  adminController.setUserStatus
);

module.exports = router;
