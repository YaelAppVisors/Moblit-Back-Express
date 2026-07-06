const Request = require("../models/Request");
const Negocios = require("../models/Negocios");
const {isEmptyValue} = require('../helpers/ValidateValue');
const mongoose = require("mongoose");
const { generateRequestPdf } = require('../helpers/generateRequestPdf');
const { nextFolio } = require("../services/folio.service");
const { PERMISSIONS } = require("../services/rbac.service");

const hasGlobalRequestAccess = (req) => {
  if (!req?.authUser) return false;
  if (String(req.authUser.perfil || "").toLowerCase() === "admin") return true;
  return Array.isArray(req.authPermissions)
    && req.authPermissions.includes(PERMISSIONS.NEGOCIOS_MANAGE);
};

const getAuthNegocioId = (req) => {
  if (!req?.authUser?.negocio) return null;
  return String(req.authUser.negocio);
};

const getRequestStoreId = (request = {}) => {
  const store = request?.requestHeader?.store;
  if (!store) return null;
  if (typeof store === "object" && store._id) {
    return String(store._id);
  }
  return String(store);
};

const buildStoreScopeFilter = (req) => {
  if (hasGlobalRequestAccess(req)) {
    return {};
  }

  const negocioId = getAuthNegocioId(req);
  if (!negocioId) {
    return { "requestHeader.store": { $in: [] } };
  }

  return { "requestHeader.store": new mongoose.Types.ObjectId(negocioId) };
};

const ensureRequestAccess = (req, request) => {
  if (hasGlobalRequestAccess(req)) {
    return true;
  }

  const negocioId = getAuthNegocioId(req);
  if (!negocioId) {
    return false;
  }

  return getRequestStoreId(request) === negocioId;
};

const syncRequestDesfaseStatus = async (request) => {
  if (!request) return request;

  const latestStatus = request.statusHistory?.[request.statusHistory.length - 1]?.statusName;
  if (['Finalizado', 'Cancelado', 'Cerrado', 'Desfasado'].includes(latestStatus)) {
    return request;
  }

  let desfaseHoras = Number(request.requestHeader?.desfaseHoras ?? 0);
  if (!Number.isFinite(desfaseHoras) || desfaseHoras <= 0) {
    const nivel = request.requestHeader?.nivelDesfase || 'bajo';
    const store = request.requestHeader?.store;
    if (store && typeof store === 'object') {
      desfaseHoras = Number(store[`desfase_${nivel}_horas`] ?? 0);
    } else if (store) {
      const negocio = await Negocios.findById(store);
      if (negocio) {
        desfaseHoras = Number(negocio[`desfase_${nivel}_horas`] ?? 0);
      }
    }
  }

  if (!Number.isFinite(desfaseHoras) || desfaseHoras <= 0) {
    return request;
  }

  const createdAt = request.createdAt ? new Date(request.createdAt) : null;
  if (!createdAt) {
    return request;
  }

  const thresholdDate = new Date(createdAt.getTime() + desfaseHoras * 60 * 60 * 1000);
  if (new Date() < thresholdDate) {
    return request;
  }

  const alreadyDesfasado = request.statusHistory?.some(
    (entry) => entry?.statusName === 'Desfasado'
  );

  if (!alreadyDesfasado) {
    request.statusHistory.push({
      statusName: 'Desfasado',
      createdBy: request.requestHeader?.createdBy || request.requestHeader?.assignedTo,
    });
    await request.save();
  }

  return request;
};

exports.CreateRequest = async (req, res) => {
  const { requestHeader, requestResponse } = req.body;

  if( requestHeader && requestResponse ){
    
    if( isEmptyValue(requestHeader?.clientData) || isEmptyValue(requestHeader?.clientData?.clientFullName) ){
        return res.status(400).json({ message: 'Los datos del cliente son requeridos' });
    }
    if( isEmptyValue(requestHeader?.serviceType) ){
        return res.status(400).json({ message: 'El tipo de servicio es requerido' });
    }
    if( isEmptyValue(requestHeader?.store) ){
        return res.status(400).json({ message: 'El negocio asignado es requerido' });
    }
    if( isEmptyValue(requestHeader?.assignedTo) ){
        return res.status(400).json({ message: 'El técnico asignado es requerido' });
    }
    if( isEmptyValue(requestHeader?.createdBy) ){
        return res.status(400).json({ message: 'El usuario de creación es requerido' });
    }
    
    try {
        if (!hasGlobalRequestAccess(req)) {
          const authNegocioId = getAuthNegocioId(req);
          if (!authNegocioId) {
            return res.status(403).json({ message: 'No tienes un negocio asignado para crear tickets' });
          }
          if (String(requestHeader.store) !== authNegocioId) {
            return res.status(403).json({ message: 'No tienes permisos para crear tickets en otro negocio' });
          }
        }

        let ticket = requestHeader?.ticket;
        let desfaseHoras = requestHeader?.desfaseHoras ?? 0;
        const nivelDesfase = ['bajo', 'medio', 'alto'].includes(requestHeader?.nivelDesfase)
          ? requestHeader.nivelDesfase
          : 'bajo';

        if (isEmptyValue(ticket)) {
            const generatedFolio = await nextFolio({
              modulo: "REQUEST",
              negocio: requestHeader.store,
              prefijo: "TKT",
            });
            ticket = generatedFolio.folio;
        }

        if (!isEmptyValue(requestHeader?.store)) {
          const negocio = await Negocios.findById(requestHeader.store);
          if (negocio) {
            desfaseHoras = Number(negocio[`desfase_${nivelDesfase}_horas`] ?? 0);
          }
        }

        // Agregar estatus inicial "Pendiente" automáticamente
        const requestData = {
            ...req.body,
            requestHeader: {
              ...requestHeader,
              ticket,
              descripcion: requestHeader?.descripcion ?? "",
              ubicacion: requestHeader?.ubicacion ?? "",
              fechaEstimada: requestHeader?.fechaEstimada ?? null,
              horaEstimada: requestHeader?.horaEstimada ?? null,
              notasInternas: requestHeader?.notasInternas ?? "",
              nivelDesfase,
              desfaseHoras,
            },
            statusHistory: [{
                statusName: 'Pendiente',
                createdBy: requestHeader.createdBy
            }]
        };

        const requestCreated = new Request(requestData);
        await requestCreated.save();
        
        // Populate para retornar los datos completos
        const populatedRequest = await Request.findById(requestCreated._id)
            .populate([
                {path: 'requestHeader.store', select: "-planes"},
                {path: 'requestHeader.assignedTo', select: "-password"},
                {path: 'requestHeader.createdBy', select: "-password"},
                {path: 'statusHistory.createdBy', select: "-password"}
            ]);
        
        res.status(200).json({ message: 'El ticket se creó con éxito', data: populatedRequest });
    } catch (err) {
    res.status(500).json({ message: err?.message });
    }
  }else{
    res.status(400).json({ message: 'Hay valores requeridos vacíos' });
  }
};

exports.getRequestById = async (req, res) => {
  const requestID = req.params.id;

  try {
    const request = await Request.findById(requestID);
    if (request) {
        if (!ensureRequestAccess(req, request)) {
          return res.status(403).json({ message: 'No tienes permisos para consultar este ticket' });
        }
        await syncRequestDesfaseStatus(request);
        const populatedRequest = await request.populate([
            {path: 'requestHeader.store', select: "-planes"},
            {path: 'requestHeader.assignedTo', select: "-password"},
            {path: 'requestHeader.createdBy', select: "-password"},
            {path: 'statusHistory.createdBy', select: "-password"}
        ]);
        return res.status(200).json({ message: "Ticket encontrado", data: populatedRequest });
    } else {
        return res.status(400).json({ message: "Ticket does not exist" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

exports.getAllRequest = async (req, res) => {
   try {
  const request = await Request.find(buildStoreScopeFilter(req)).sort({ createdAt: -1 });

    if (request) {
        await Promise.all(request.map((item) => syncRequestDesfaseStatus(item)));
        const populatedRequests = await Request.populate(request, [
            {path: 'requestHeader.store', select: "-planes"},
            {path: 'requestHeader.assignedTo', select: "-password"},
            {path: 'requestHeader.createdBy', select: "-password"},
            {path: 'statusHistory.createdBy', select: "-password"}
        ]);
        return res.status(200).json({ message: "Tickets encontrados", data: populatedRequests });
    } else {
        return res.status(400).json({ message: "No hay ningún ticket" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

exports.getRequestByAssignedTo = async (req, res) => {
  const userID = req.params.id;

  try {
    const objectId = new mongoose.Types.ObjectId(userID);
    const filter = {
      'requestHeader.assignedTo': objectId,
      ...buildStoreScopeFilter(req),
    };
    const request = await Request.find(filter).sort({ createdAt: -1 });
    if (request) {
        await Promise.all(request.map((item) => syncRequestDesfaseStatus(item)));
        const populatedRequests = await Request.populate(request, [
            {path: 'requestHeader.store', select: "-planes"},
            {path: 'requestHeader.assignedTo', select: "-password"},
            {path: 'requestHeader.createdBy', select: "-password"},
            {path: 'statusHistory.createdBy', select: "-password"}
        ]);
        return res.status(200).json({ message: "Tickets encontrado", data: populatedRequests });
    } else {
        return res.status(200).json({ message: "No hay ningún ticket asignado a este usuario" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

exports.getRequestByNegocio = async (req, res) => {
  const negocioId = req.params.id;

  try {
    if (!hasGlobalRequestAccess(req)) {
      const authNegocioId = getAuthNegocioId(req);
      if (!authNegocioId || authNegocioId !== String(negocioId)) {
        return res.status(403).json({ message: 'No tienes permisos para consultar tickets de otro negocio' });
      }
    }

    const objectId = new mongoose.Types.ObjectId(negocioId);
    const request = await Request.find({'requestHeader.store': objectId}).sort({ createdAt: -1 });
    if (request) {
        await Promise.all(request.map((item) => syncRequestDesfaseStatus(item)));
        const populatedRequests = await Request.populate(request, [
            {path: 'requestHeader.store', select: "-planes"},
            {path: 'requestHeader.assignedTo', select: "-password"},
            {path: 'requestHeader.createdBy', select: "-password"},
            {path: 'statusHistory.createdBy', select: "-password"}
        ]);
        return res.status(200).json({ message: "Tickets encontrados", data: populatedRequests });
    } else {
        return res.status(200).json({ message: "No hay ningún ticket asignado a este usuario" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  const RequestID = req.params.id;
  const { statusName, createdBy } = req.body;

  if (!statusName || !createdBy) {
    return res.status(400).json({ message: 'El nombre del estatus y el usuario son requeridos' });
  }

  const validStatuses = ['Pendiente', 'En proceso', 'Finalizado', 'Cancelado', 'Cerrado', 'Desfasado'];
  if (!validStatuses.includes(statusName)) {
    return res.status(400).json({ 
      message: `Estatus inválido. Los estatus válidos son: ${validStatuses.join(', ')}` 
    });
  }

  try {
    const request = await Request.findById(RequestID);
    if (!request) {
      return res.status(404).json({ message: 'No se encontró el ticket' });
    }

    if (!ensureRequestAccess(req, request)) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar este ticket' });
    }

    const newStatus = {
      statusName,
      createdBy: new mongoose.Types.ObjectId(createdBy)
    };

    request.statusHistory.push(newStatus);
    await request.save();

    const updatedRequest = await Request.findById(RequestID);
    const populatedUpdatedRequest = await updatedRequest.populate([
      { path: 'requestHeader.store', select: "-planes" },
      { path: 'requestHeader.assignedTo', select: "-password" },
      { path: 'requestHeader.createdBy', select: "-password" },
      { path: 'statusHistory.createdBy', select: "-password" }
    ]);

    return res.status(200).json({ 
      message: 'Estatus actualizado exitosamente', 
      data: populatedUpdatedRequest 
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateRequest = async (req, res) => {
  const RequestID = req.params.id;
  let update = req.body;

  try {
    const request = await Request.findById(RequestID);
    if (!request) {
      return res.status(404).json({ message: 'No se encontró el registro' });
    }

    if (!ensureRequestAccess(req, request)) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar este ticket' });
    }

    const requestUpdated = await Request.findByIdAndUpdate(RequestID, update, { new: true })
      .populate([
        { path: 'requestHeader.store', select: "-planes" },
        { path: 'requestHeader.assignedTo', select: "-password" },
        { path: 'requestHeader.createdBy', select: "-password" },
        { path: 'statusHistory.createdBy', select: "-password" }
      ]);

    if (requestUpdated) {
      return res.status(200).json({ 
        message: 'Registro actualizado exitosamente', 
        data: requestUpdated 
      });
    } else {
      return res.status(400).json({ message: 'No fue posible actualizar el registro' });
    }

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  const RequestID = req.params.id;
  try {
    const request = await Request.findById(RequestID);
    if (!request) {
      return res.status(404).json({ message: 'No se encontró el registro' });
    }

    if (!ensureRequestAccess(req, request)) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este ticket' });
    }

    const requestDeleted = await Request.findByIdAndDelete(RequestID);
    if (requestDeleted) {
      return res.status(200).json({ message: 'Registro eliminado exitosamente' });
    } else {
      return res.status(400).json({ message: 'No fue posible eliminar el registro' });
    }

  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.generatePdf = async (req, res) => {
  const requestID = req.params.id;

  try {
    const request = await Request.findById(requestID)
      .populate([
        { path: 'requestHeader.store',      select: '-planes' },
        { path: 'requestHeader.assignedTo', select: '-password' },
        { path: 'requestHeader.createdBy',  select: '-password' },
      ])
      .lean();

    if (!request) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    if (!ensureRequestAccess(req, request)) {
      return res.status(403).json({ message: 'No tienes permisos para consultar este ticket' });
    }

    const pdfBuffer = await generateRequestPdf(request);
    const filename  = `reporte-${request.requestHeader.ticket}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};