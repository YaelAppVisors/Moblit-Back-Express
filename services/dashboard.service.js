const Request = require('../models/Request');
const Hallazgo = require('../models/Hallazgo');
const User = require('../models/User');

/**
 * Obtener total de inspecciones realizadas
 */
const getTotalInspections = async (filters = {}) => {
    try {
        const query = {};
        
        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
            if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
        }
        // Filtrar por negocio si está disponible
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            query['requestHeader.store'] = { $in: filters.negociosIds };
        }

        const total = await Request.countDocuments(query);
        
        return {
            total,
            label: 'Total completadas'
        };
    } catch (error) {
        throw new Error(`Error al obtener inspecciones: ${error.message}`);
    }
};

/**
 * Obtener inspectores activos
 */
const getActiveInspectors = async (filters = {}) => {
    try {
        // Inspectores con rol 'tecnico' o asignados a Request activos
        const query = {
            activo: true,
            perfil: { $in: ['tecnico', 'coor'] }
        };
        // Filtrar por negocio si está disponible
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            query.negocio = { $in: filters.negociosIds };
        }

        const inspectors = await User.find(query);
        
        return {
            count: inspectors.length,
            label: 'En operación',
            inspectors: inspectors
        };
    } catch (error) {
        throw new Error(`Error al obtener inspectores activos: ${error.message}`);
    }
};

/**
 * Obtener total de hallazgos detectados
 */
const getDetectedFindings = async (filters = {}) => {
    try {
        const query = {};
        
        if (filters.startDate || filters.endDate) {
            query.fecha_inicio = {};
            if (filters.startDate) query.fecha_inicio.$gte = new Date(filters.startDate);
            if (filters.endDate) query.fecha_inicio.$lte = new Date(filters.endDate);
        }
        // Filtrar por negocios a través de Request
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            const requests = await Request.find(
                { 'requestHeader.store': { $in: filters.negociosIds } }
            ).select('_id');
            const requestIds = requests.map(r => r._id);
            query.id_registro_lista_verificacion = { $in: requestIds };
        }

        const total = await Hallazgo.countDocuments(query);
        
        return {
            total,
            label: 'Identificados'
        };
    } catch (error) {
        throw new Error(`Error al obtener hallazgos: ${error.message}`);
    }
};

/**
 * Obtener hallazgos subsanados (estado: Cerrado)
 */
const getResolvedFindings = async (filters = {}) => {
    try {
        const query = { estado: 'Cerrado' };
        
        if (filters.startDate || filters.endDate) {
            query.fecha_fin = {};
            if (filters.startDate) query.fecha_fin.$gte = new Date(filters.startDate);
            if (filters.endDate) query.fecha_fin.$lte = new Date(filters.endDate);
        }
        // Filtrar por negocios a través de Request
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            const requests = await Request.find(
                { 'requestHeader.store': { $in: filters.negociosIds } }
            ).select('_id');
            const requestIds = requests.map(r => r._id);
            query.id_registro_lista_verificacion = { $in: requestIds };
        }

        const total = await Hallazgo.countDocuments(query);
        
        return {
            total,
            label: 'Corregidos'
        };
    } catch (error) {
        throw new Error(`Error al obtener hallazgos subsanados: ${error.message}`);
    }
};

/**
 * Obtener actividades por mes
 */
const getActivitiesByMonth = async (filters = {}) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: {
                        $month: '$createdAt'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ];
        // Filtrar por negocios si está disponible
        const matchStage = {};
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            matchStage['requestHeader.store'] = { $in: filters.negociosIds };
        }

        const pipelineWithMatch = matchStage && Object.keys(matchStage).length > 0
            ? [{ $match: matchStage }, ...pipeline]
            : pipeline;

        const activities = await Request.aggregate(pipeline);
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const result = activities.map(item => ({
            month: monthNames[item._id - 1],
            count: item.count
        }));

        return result;
    } catch (error) {
        throw new Error(`Error al obtener actividades por mes: ${error.message}`);
    }
};

/**
 * Obtener inspectores activos por mes
 */
const getActiveInspectorsByMonth = async (filters = {}) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        inspector: '$requestHeader.assignedTo'
                    }
                }
            },
            {
                $group: {
                    _id: '$_id.month',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ];

        const matchStage = {};
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            matchStage['requestHeader.store'] = { $in: filters.negociosIds };
        }

        const pipelineWithMatch = matchStage && Object.keys(matchStage).length > 0
            ? [{ $match: matchStage }, ...pipeline]
            : pipeline;

        const inspectors = await Request.aggregate(pipelineWithMatch);
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const result = inspectors.map(item => ({
            month: monthNames[item._id - 1],
            count: item.count
        }));

        return result;
    } catch (error) {
        throw new Error(`Error al obtener inspectores activos por mes: ${error.message}`);
    }
};

/**
 * Obtener distribución de hallazgos por severidad
 */
const getFindigsBySeverity = async (filters = {}) => {
    try {
        const query = {};
        
        if (filters.startDate || filters.endDate) {
            query.fecha_inicio = {};
            if (filters.startDate) query.fecha_inicio.$gte = new Date(filters.startDate);
            if (filters.endDate) query.fecha_inicio.$lte = new Date(filters.endDate);
        }

        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: '$severity',
                    count: { $sum: 1 }
                }
            }
        ];

        const distribution = await Hallazgo.aggregate(pipeline);
        
        // Retornar distribución predefinida si no hay datos
        if (distribution.length === 0) {
            return {
                critical: { count: 0, percentage: 0 },
                high: { count: 0, percentage: 0 },
                medium: { count: 0, percentage: 0 },
                low: { count: 0, percentage: 0 }
            };
        }

        const total = distribution.reduce((sum, item) => sum + item.count, 0);
        
        return {
            critical: { 
                count: distribution.find(d => d._id === 'Crítico')?.count || 0,
                percentage: ((distribution.find(d => d._id === 'Crítico')?.count || 0) / total * 100).toFixed(0)
            },
            high: { 
                count: distribution.find(d => d._id === 'Alto')?.count || 0,
                percentage: ((distribution.find(d => d._id === 'Alto')?.count || 0) / total * 100).toFixed(0)
            },
            medium: { 
                count: distribution.find(d => d._id === 'Medio')?.count || 0,
                percentage: ((distribution.find(d => d._id === 'Medio')?.count || 0) / total * 100).toFixed(0)
            },
            low: { 
                count: distribution.find(d => d._id === 'Bajo')?.count || 0,
                percentage: ((distribution.find(d => d._id === 'Bajo')?.count || 0) / total * 100).toFixed(0)
            }
        };
    } catch (error) {
        throw new Error(`Error al obtener distribución de hallazgos: ${error.message}`);
    }
};

/**
 * Obtener asignación de inspecciones por semana/período
 */
const getInspectionAssignment = async (filters = {}) => {
    try {
        const matchStage = {};
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            matchStage['requestHeader.store'] = { $in: filters.negociosIds };
        }

        const pipeline = [];
        if (Object.keys(matchStage).length > 0) pipeline.push({ $match: matchStage });

        pipeline.push(
            {
                $group: {
                    _id: { $week: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 8 }
        );

        const assignments = await Request.aggregate(pipeline);

        const result = assignments.map(item => ({
            week: `S${item._id}`,
            count: item.count
        }));

        return result.reverse();
    } catch (error) {
        throw new Error(`Error al obtener asignación de inspecciones: ${error.message}`);
    }
};

/**
 * Obtener hallazgos abiertos vs cerrados
 */
const getFindingsOpenVsClosed = async (filters = {}) => {
    try {
        const query = {};
        
        if (filters.startDate || filters.endDate) {
            query.fecha_inicio = {};
            if (filters.startDate) query.fecha_inicio.$gte = new Date(filters.startDate);
            if (filters.endDate) query.fecha_inicio.$lte = new Date(filters.endDate);
        }

        // Filtrar por negocios
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            const requests = await Request.find(
                { 'requestHeader.store': { $in: filters.negociosIds } }
            ).select('_id');
            const requestIds = requests.map(r => r._id);
            query.id_registro_lista_verificacion = { $in: requestIds };
        }

        const open = await Hallazgo.countDocuments({ ...query, estado: { $ne: 'Cerrado' } });
        const closed = await Hallazgo.countDocuments({ ...query, estado: 'Cerrado' });
        const total = open + closed;

        return {
            open: { 
                count: open,
                percentage: total > 0 ? (open / total * 100).toFixed(0) : 0
            },
            closed: { 
                count: closed,
                percentage: total > 0 ? (closed / total * 100).toFixed(0) : 0
            },
            total
        };
    } catch (error) {
        throw new Error(`Error al obtener hallazgos abiertos vs cerrados: ${error.message}`);
    }
};

/**
 * Obtener estado de inspectores (disponibles, ocupados, carga promedio)
 */
const getInspectorStatus = async (filters = {}) => {
    try {
        const inspectors = await User.find({ 
            activo: true,
            perfil: { $in: ['tecnico', 'coor'] }
        });

        const inspectorIds = inspectors.map(i => i._id);

        // Obtener asignaciones activas por inspector
        const matchStage = { 'requestHeader.assignedTo': { $in: inspectorIds } };
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            matchStage['requestHeader.store'] = { $in: filters.negociosIds };
        }

        const assignments = await Request.aggregate([
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: '$requestHeader.assignedTo',
                    count: { $sum: 1 }
                }
            }
        ]);

        const assignmentMap = {};
        assignments.forEach(a => {
            assignmentMap[a._id.toString()] = a.count;
        });

        let totalWorkload = 0;
        let available = 0;
        let occupied = 0;

        const inspectorDetails = inspectors.map(inspector => {
            const workload = assignmentMap[inspector._id.toString()] || 0;
            const workloadPercentage = workload > 0 ? Math.min((workload / 10) * 100, 100) : 0;
            
            totalWorkload += workloadPercentage;
            
            if (workload === 0) {
                available++;
            } else {
                occupied++;
            }

            return {
                _id: inspector._id,
                username: inspector.username,
                email: inspector.email,
                workload: workload,
                workloadPercentage: workloadPercentage.toFixed(0)
            };
        });

        const averageWorkload = inspectors.length > 0 ? (totalWorkload / inspectors.length).toFixed(0) : 0;

        return {
            total: inspectors.length,
            available,
            occupied,
            averageWorkload,
            inspectors: inspectorDetails
        };
    } catch (error) {
        throw new Error(`Error al obtener estado de inspectores: ${error.message}`);
    }
};

/**
 * Obtener carga de trabajo por inspector
 */
const getInspectorWorkload = async (filters = {}) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: '$requestHeader.assignedTo',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'inspector'
                }
            },
            {
                $unwind: '$inspector'
            },
            {
                $project: {
                    _id: 1,
                    name: '$inspector.username',
                    email: '$inspector.email',
                    count: 1
                }
            },
            {
                $sort: { count: -1 }
            }
        ];

        const matchStage = {};
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            matchStage['requestHeader.store'] = { $in: filters.negociosIds };
        }

        const pipelineWithMatch = matchStage && Object.keys(matchStage).length > 0
            ? [{ $match: matchStage }, ...pipeline]
            : pipeline;

        const workload = await Request.aggregate(pipelineWithMatch);

        return workload.map(item => ({
            inspector: item.name,
            email: item.email,
            tasks: item.count
        }));
    } catch (error) {
        throw new Error(`Error al obtener carga de trabajo: ${error.message}`);
    }
};

/**
 * Obtener lista completa de todos los inspectores con detalles
 */
const getAllInspectors = async (filters = {}) => {
    try {
        const inspectors = await User.find({ 
            activo: true,
            perfil: { $in: ['tecnico', 'coor'] }
        });

        const inspectorIds = inspectors.map(i => i._id);

        // Obtener asignaciones por inspector
        const matchStage = { 'requestHeader.assignedTo': { $in: inspectorIds } };
        if (filters.negociosIds && filters.negociosIds.length > 0) {
            matchStage['requestHeader.store'] = { $in: filters.negociosIds };
        }

        const assignments = await Request.aggregate([
            {
                $match: matchStage
            },
            {
                $group: {
                    _id: '$requestHeader.assignedTo',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Obtener hallazgos por inspector
        const findings = await Hallazgo.aggregate([
            {
                $match: {
                    id_usuario_responsable: { $in: inspectorIds }
                }
            },
            {
                $group: {
                    _id: '$id_usuario_responsable',
                    total: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$estado', 'Cerrado'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const assignmentMap = {};
        assignments.forEach(a => {
            assignmentMap[a._id.toString()] = a.count;
        });

        const findingsMap = {};
        findings.forEach(f => {
            findingsMap[f._id.toString()] = f;
        });

        const result = inspectors.map(inspector => {
            const taskCount = assignmentMap[inspector._id.toString()] || 0;
            const findingData = findingsMap[inspector._id.toString()] || { total: 0, completed: 0 };
            const workloadPercentage = taskCount > 0 ? Math.min((taskCount / 10) * 100, 100) : 0;

            return {
                _id: inspector._id,
                name: inspector.username,
                email: inspector.email,
                area: inspector.negocio ? 'Múltiple' : 'Centro', // Ajustar según necesidad
                status: taskCount === 0 ? 'Disponible' : 'Ocupado',
                workload: workloadPercentage.toFixed(0),
                tasksCompleted: findingData.completed,
                tasksTotal: findingData.total,
                lastActivity: inspector.updatedAt || 'N/A'
            };
        });

        return result;
    } catch (error) {
        throw new Error(`Error al obtener lista de inspectores: ${error.message}`);
    }
};

/**
 * Obtener resumen completo del dashboard
 */
const getDashboardSummary = async (filters = {}) => {
    try {
        const [
            totalInspections,
            activeInspectors,
            detectedFindings,
            resolvedFindings,
            activitiesByMonth,
            activeInspectorsByMonth,
            findingsBySeverity,
            inspectionAssignment,
            findingsOpenVsClosed,
            inspectorStatus,
            inspectorWorkload,
            allInspectors
        ] = await Promise.all([
            getTotalInspections(filters),
            getActiveInspectors(filters),
            getDetectedFindings(filters),
            getResolvedFindings(filters),
            getActivitiesByMonth(filters),
            getActiveInspectorsByMonth(filters),
            getFindigsBySeverity(filters),
            getInspectionAssignment(filters),
            getFindingsOpenVsClosed(filters),
            getInspectorStatus(filters),
            getInspectorWorkload(filters),
            getAllInspectors(filters)
        ]);

        return {
            summary: {
                totalInspections,
                activeInspectors,
                detectedFindings,
                resolvedFindings
            },
            charts: {
                activitiesByMonth,
                activeInspectorsByMonth,
                findingsBySeverity,
                inspectionAssignment,
                findingsOpenVsClosed
            },
            inspectors: {
                status: inspectorStatus,
                workload: inspectorWorkload,
                all: allInspectors
            }
        };
    } catch (error) {
        throw new Error(`Error al obtener resumen del dashboard: ${error.message}`);
    }
};

/**
 * Calcular el estatus de disponibilidad de los técnicos.
 *
 * Reglas:
 *   en_espera  → en_linea = false  (rojo)
 *   disponible → en_linea = true + sin folios Pendiente/En proceso  (verde)
 *   asignado   → en_linea = true + tiene folios en Pendiente  (naranja)
 *   en_atencion→ en_linea = true + tiene al menos un folio en "En proceso"  (azul)
 *
 * Si tiene folios en ambos estados (Pendiente + En proceso) prevalece "en_atencion".
 */
const getTecnicosConEstatus = async (filters = {}) => {
    try {
        const userQuery = {
            activo: true,
            perfil: 'tecnico',
        };

        if (filters.negociosIds && filters.negociosIds.length > 0) {
            userQuery.negocio = { $in: filters.negociosIds };
        }

        const tecnicos = await User.find(userQuery)
            .populate('negocio', 'nombre')
            .lean();

        if (tecnicos.length === 0) return [];

        const tecnicoIds = tecnicos.map(t => t._id);

        // Obtener folios activos asignados a estos técnicos agrupados por técnico y estado
        const foliosAgrupados = await Request.aggregate([
            {
                $match: {
                    'requestHeader.assignedTo': { $in: tecnicoIds },
                    'requestHeader.activo': true,
                    'statusHistory.0.statusName': { $in: ['Pendiente', 'En proceso'] },
                },
            },
            {
                $addFields: {
                    ultimoEstatus: { $arrayElemAt: ['$statusHistory', -1] },
                },
            },
            {
                $group: {
                    _id: {
                        tecnico: '$requestHeader.assignedTo',
                        status: '$ultimoEstatus.statusName',
                    },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Indexar por tecnicoId para acceso O(1)
        const foliosMap = {};
        for (const entry of foliosAgrupados) {
            const tecId = entry._id.tecnico.toString();
            if (!foliosMap[tecId]) foliosMap[tecId] = {};
            foliosMap[tecId][entry._id.status] = entry.count;
        }

        const ESTATUS_COLORES = {
            disponible: 'verde',
            asignado: 'naranja',
            en_atencion: 'azul',
            en_espera: 'rojo',
        };

        const result = tecnicos.map(tecnico => {
            const id = tecnico._id.toString();
            const folios = foliosMap[id] || {};
            let estatus;

            if (!tecnico.en_linea) {
                estatus = 'en_espera';
            } else if (folios['En proceso'] > 0) {
                estatus = 'en_atencion';
            } else if (folios['Pendiente'] > 0) {
                estatus = 'asignado';
            } else {
                estatus = 'disponible';
            }

            // Última ubicación conocida
            const ultimaUbicacion =
                Array.isArray(tecnico.location) && tecnico.location.length > 0
                    ? tecnico.location[tecnico.location.length - 1]
                    : null;

            return {
                _id: tecnico._id,
                username: tecnico.username,
                email: tecnico.email,
                negocio: tecnico.negocio,
                en_linea: tecnico.en_linea,
                ultimo_ping: tecnico.ultimo_ping,
                ultima_ubicacion: ultimaUbicacion,
                folios_pendientes: folios['Pendiente'] || 0,
                folios_en_proceso: folios['En proceso'] || 0,
                estatus,
                color: ESTATUS_COLORES[estatus],
            };
        });

        return result;
    } catch (error) {
        throw new Error(`Error al obtener estatus de técnicos: ${error.message}`);
    }
};

module.exports = {
    getTotalInspections,
    getActiveInspectors,
    getDetectedFindings,
    getResolvedFindings,
    getActivitiesByMonth,
    getActiveInspectorsByMonth,
    getFindigsBySeverity,
    getInspectionAssignment,
    getFindingsOpenVsClosed,
    getInspectorStatus,
    getInspectorWorkload,
    getAllInspectors,
    getDashboardSummary,
    getTecnicosConEstatus,
};
