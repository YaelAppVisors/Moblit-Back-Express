const Request = require("../models/Request");
const {isEmptyValue} = require('../helpers/ValidateValue');
const mongoose = require("mongoose");

exports.CreateRequest = async (req, res) => {
  const { requestHeader, requestResponse } = req.body;

  if( requestHeader && requestResponse ){
    
    if( isEmptyValue(requestHeader?.clientData) || isEmptyValue(requestHeader?.clientData?.clientFullName) ){
        return res.status(400).json({ message: 'Los datos del cliente son requeridos' });
    }
    if( isEmptyValue(requestHeader?.ticket) ){
        return res.status(400).json({ message: 'El número de referencia es requerido' });
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
        const requestCreated = new Request(req.body);
        await requestCreated.save();
        
        res.status(200).json({ message: 'El ticket se creó con éxito', data: requestCreated });
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
    const request = await Request.findById(requestID)
    .populate([
        {path: 'requestHeader.store', select: "-planes"},
        {path: 'requestHeader.assignedTo', select: "-password"},
        {path: 'requestHeader.createdBy', select: "-password"}
    ]);
    if (request) {
        return res.status(200).json({ message: "Ticket encontrado", data: request });
    } else {
        return res.status(400).json({ message: "Ticket does not exist" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

exports.getAllRequest = async (req, res) => {
   try {
    const request = await Request.find()
    .populate([
        {path: 'requestHeader.store', select: "-planes"},
        {path: 'requestHeader.assignedTo', select: "-password"},
        {path: 'requestHeader.createdBy', select: "-password"}
    ])
    .sort({ createdAt: -1 });

    if (request) {
        return res.status(200).json({ message: "Tickets encontrados", data: request });
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
    const request = await Request.find({'requestHeader.assignedTo': objectId})
    .populate([
        {path: 'requestHeader.store', select: "-planes"},
        {path: 'requestHeader.assignedTo', select: "-password"},
        {path: 'requestHeader.createdBy', select: "-password"}
    ])
    .sort({ createdAt: -1 });
    if (request) {
        return res.status(200).json({ message: "Tickets encontrado", data: request });
    } else {
        return res.status(200).json({ message: "No hay ningún ticket asignado a este usuario" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
  }
};

exports.getRequestByNegocio = async (req, res) => {
  const userID = req.params.id;

  try {
    const objectId = new mongoose.Types.ObjectId(userID);
    const request = await Request.find({'requestHeader.store': objectId})
    .populate([
        {path: 'requestHeader.store', select: "-planes"},
        {path: 'requestHeader.assignedTo', select: "-password"},
        {path: 'requestHeader.createdBy', select: "-password"}
    ])
    .sort({ createdAt: -1 });
    if (request) {
        return res.status(200).json({ message: "Tickets encontrados", data: request });
    } else {
        return res.status(200).json({ message: "No hay ningún ticket asignado a este usuario" });
    }
  } catch (error) {
    return res.status(500).json({ message: error?.message });
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

    const requestUpdated = await Request.findByIdAndUpdate(RequestID, update, { new: true })
      .populate([
        { path: 'requestHeader.store', select: "-planes" },
        { path: 'requestHeader.assignedTo', select: "-password" },
        { path: 'requestHeader.createdBy', select: "-password" }
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