var express = require("express");
var router = express.Router();
var planController = require("../controllers/planController");

router.get("/", planController.getPlanes);
router.get("/:id", planController.getPlanById);
router.post("/", planController.createPlan);
router.put("/:id", planController.updatePlan);
router.delete("/:id", planController.deletePlan);

module.exports = router;
