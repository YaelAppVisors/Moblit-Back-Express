const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middlewares/auth.middleware');

// Aplicar middleware de autenticación a todas las rutas del dashboard
router.use(requireAuth);

/**
 * @route   GET /dashboard/summary
 * @desc    Obtener resumen completo del dashboard con todos los datos
 * @access  Private
 */
router.get('/summary', dashboardController.getDashboardSummary);

/**
 * @route   GET /dashboard/inspections/total
 * @desc    Obtener total de inspecciones realizadas
 * @access  Private
 */
router.get('/inspections/total', dashboardController.getTotalInspections);

/**
 * @route   GET /dashboard/inspectors/active
 * @desc    Obtener cantidad de inspectores activos
 * @access  Private
 */
router.get('/inspectors/active', dashboardController.getActiveInspectors);

/**
 * @route   GET /dashboard/findings/detected
 * @desc    Obtener total de hallazgos detectados
 * @access  Private
 */
router.get('/findings/detected', dashboardController.getDetectedFindings);

/**
 * @route   GET /dashboard/findings/resolved
 * @desc    Obtener total de hallazgos subsanados
 * @access  Private
 */
router.get('/findings/resolved', dashboardController.getResolvedFindings);

/**
 * @route   GET /dashboard/activities/monthly
 * @desc    Obtener actividades por mes (inspecciones)
 * @access  Private
 */
router.get('/activities/monthly', dashboardController.getActivitiesByMonth);

/**
 * @route   GET /dashboard/inspectors/monthly
 * @desc    Obtener inspectores activos por mes
 * @access  Private
 */
router.get('/inspectors/monthly', dashboardController.getActiveInspectorsByMonth);

/**
 * @route   GET /dashboard/findings/severity
 * @desc    Obtener distribución de hallazgos por severidad
 * @access  Private
 */
router.get('/findings/severity', dashboardController.getFindigsBySeverity);

/**
 * @route   GET /dashboard/inspections/assignment
 * @desc    Obtener asignación de inspecciones por semana
 * @access  Private
 */
router.get('/inspections/assignment', dashboardController.getInspectionAssignment);

/**
 * @route   GET /dashboard/findings/open-vs-closed
 * @desc    Obtener hallazgos abiertos vs cerrados
 * @access  Private
 */
router.get('/findings/open-vs-closed', dashboardController.getFindingsOpenVsClosed);

/**
 * @route   GET /dashboard/inspectors/status
 * @desc    Obtener estado de inspectores (disponibles, ocupados, carga promedio)
 * @access  Private
 */
router.get('/inspectors/status', dashboardController.getInspectorStatus);

/**
 * @route   GET /dashboard/inspectors/workload
 * @desc    Obtener carga de trabajo por inspector
 * @access  Private
 */
router.get('/inspectors/workload', dashboardController.getInspectorWorkload);

/**
 * @route   GET /dashboard/inspectors/all
 * @desc    Obtener lista completa de todos los inspectores con detalles
 * @access  Private
 */
router.get('/inspectors/all', dashboardController.getAllInspectors);

module.exports = router;
