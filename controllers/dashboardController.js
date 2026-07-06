const dashboardService = require('../services/dashboard.service');

/**
 * GET /dashboard/summary
 * Obtener resumen completo del dashboard
 */
exports.getDashboardSummary = async (req, res) => {
    try {
            // Obtener negociosIds basado en permisos del usuario
            let negociosIds = [];
        
            // Si es admin o tiene NEGOCIOS_MANAGE, puede ver todos los negocios
            if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
                // Permitir especificar negocios en query param
                if (req.query.negocios) {
                    negociosIds = Array.isArray(req.query.negocios)
                        ? req.query.negocios
                        : [req.query.negocios];
                }
                // Si no especifica negocios, obtener todos
            } else if (req.authUser.negocio) {
                // Usuario pertenece a un negocio específico
                negociosIds = [req.authUser.negocio];
            }

            const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            area: req.query.area,
            frente: req.query.frente,
            proyecto: req.query.proyecto,
            negociosIds: negociosIds
        };

        const summary = await dashboardService.getDashboardSummary(filters);
        
        res.status(200).json({
            success: true,
            message: 'Resumen del dashboard obtenido exitosamente',
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/inspections/total
 * Obtener total de inspecciones realizadas
 */
exports.getTotalInspections = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            negociosIds: negociosIds
        };

        const result = await dashboardService.getTotalInspections(filters);
        
        res.status(200).json({
            success: true,
            message: 'Total de inspecciones obtenido',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/inspectors/active
 * Obtener inspectores activos
 */
exports.getActiveInspectors = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = {
            area: req.query.area,
            frente: req.query.frente,
            proyecto: req.query.proyecto,
            negociosIds: negociosIds
        };

        const result = await dashboardService.getActiveInspectors(filters);
        
        res.status(200).json({
            success: true,
            message: 'Inspectores activos obtenidos',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/findings/detected
 * Obtener hallazgos detectados
 */
exports.getDetectedFindings = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            negociosIds: negociosIds
        };

        const result = await dashboardService.getDetectedFindings(filters);
        
        res.status(200).json({
            success: true,
            message: 'Hallazgos detectados obtenidos',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/findings/resolved
 * Obtener hallazgos subsanados
 */
exports.getResolvedFindings = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            negociosIds: negociosIds
        };

        const result = await dashboardService.getResolvedFindings(filters);
        
        res.status(200).json({
            success: true,
            message: 'Hallazgos subsanados obtenidos',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/activities/monthly
 * Obtener actividades por mes
 */
exports.getActivitiesByMonth = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = { negociosIds: negociosIds };
        const result = await dashboardService.getActivitiesByMonth(filters);
        
        res.status(200).json({
            success: true,
            message: 'Actividades por mes obtenidas',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/inspectors/monthly
 * Obtener inspectores activos por mes
 */
exports.getActiveInspectorsByMonth = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = { negociosIds: negociosIds };
        const result = await dashboardService.getActiveInspectorsByMonth(filters);
        
        res.status(200).json({
            success: true,
            message: 'Inspectores activos por mes obtenidos',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/findings/severity
 * Obtener distribución de hallazgos por severidad
 */
exports.getFindigsBySeverity = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            negociosIds: negociosIds
        };

        const result = await dashboardService.getFindigsBySeverity(filters);
        
        res.status(200).json({
            success: true,
            message: 'Distribución de hallazgos por severidad obtenida',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/inspections/assignment
 * Obtener asignación de inspecciones
 */
exports.getInspectionAssignment = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = { negociosIds: negociosIds };
        const result = await dashboardService.getInspectionAssignment(filters);
        
        res.status(200).json({
            success: true,
            message: 'Asignación de inspecciones obtenida',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/findings/open-vs-closed
 * Obtener hallazgos abiertos vs cerrados
 */
exports.getFindingsOpenVsClosed = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            negociosIds: negociosIds
        };

        const result = await dashboardService.getFindingsOpenVsClosed(filters);
        
        res.status(200).json({
            success: true,
            message: 'Hallazgos abiertos vs cerrados obtenidos',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/inspectors/status
 * Obtener estado de inspectores
 */
exports.getInspectorStatus = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = { negociosIds: negociosIds };
        const result = await dashboardService.getInspectorStatus(filters);
        
        res.status(200).json({
            success: true,
            message: 'Estado de inspectores obtenido',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/inspectors/workload
 * Obtener carga de trabajo por inspector
 */
exports.getInspectorWorkload = async (req, res) => {
    try {
        // Obtener negociosIds basado en permisos del usuario
        let negociosIds = [];
        
        if (req.authUser.perfil === 'admin' || req.authPermissions.includes('negocios:manage')) {
            if (req.query.negocios) {
                negociosIds = Array.isArray(req.query.negocios)
                    ? req.query.negocios
                    : [req.query.negocios];
            }
        } else if (req.authUser.negocio) {
            negociosIds = [req.authUser.negocio];
        }

        const filters = { negociosIds: negociosIds };
        const result = await dashboardService.getInspectorWorkload(filters);
        
        res.status(200).json({
            success: true,
            message: 'Carga de trabajo obtenida',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/inspectors/all
 * Obtener lista completa de inspectores
 */
exports.getAllInspectors = async (req, res) => {
    try {
        const filters = {
            area: req.query.area,
            frente: req.query.frente,
            proyecto: req.query.proyecto
        };

        const result = await dashboardService.getAllInspectors(filters);
        
        res.status(200).json({
            success: true,
            message: 'Lista de inspectores obtenida',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

/**
 * GET /dashboard/tecnicos/estatus
 * Obtener lista de técnicos con su estatus de disponibilidad calculado
 */
exports.getTecnicosConEstatus = async (req, res) => {
    try {
        const filters = {};
        if (req.query.negocioId) {
            filters.negociosIds = [req.query.negocioId];
        }

        const result = await dashboardService.getTecnicosConEstatus(filters);

        res.status(200).json({
            success: true,
            message: 'Estatus de técnicos obtenido',
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            data: null,
        });
    }
};
