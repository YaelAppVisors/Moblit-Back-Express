const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requirePermissions } = require("../middlewares/access.middleware");
const { PERMISSIONS } = require("../services/rbac.service");

router.use(requireAuth);

router.get(
  "/",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportController.getReports
);
router.get(
  "/:id",
  requirePermissions([PERMISSIONS.REPORTS_VIEW]),
  reportController.getReportById
);
router.post(
  "/operativo",
  requirePermissions([PERMISSIONS.REPORTS_GENERATE]),
  reportController.generateOperationalReport
);

module.exports = router;
