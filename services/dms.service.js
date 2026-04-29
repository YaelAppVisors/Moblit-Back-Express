const File = require('../models/File');
const path = require('path');
const fs = require('fs').promises;

const processFile = async (file) => {
  if (!file) throw new Error('No se cargó ningún archivo');

  const fileUrl = `/uploads/${file.filename}`;

  const newFile = new File({
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: fileUrl
  });

  return await newFile.save();
};

const deleteFile = async (fileId) => {
  const fileRecord = await File.findById(fileId);
  if (!fileRecord) throw new Error('Archivo no encontrado en la base de datos');

  try {
    const absolutePath = path.join(process.cwd(), fileRecord.path);
    
    console.log("Intentando borrar en:", absolutePath);
    
    await fs.unlink(absolutePath);
  } catch (err) {
    console.error(`Error físico: ${err.code} - ${err.message}`);
  }

  return await File.findByIdAndDelete(fileId);
};
const deleteFileByPath = async (fileUrl) => {
  const fileRecord = await File.findOne({ url: fileUrl });
  
  if (!fileRecord) {
    throw new Error('Archivo no encontrado en la base de datos');
  }

  try {
    const absolutePath = path.join(process.cwd(), fileRecord.path);
    
    console.log("Intentando borrar en:", absolutePath);
    
    await fs.unlink(absolutePath);
  } catch (err) {
    console.error(`Error físico: ${err.code} - ${err.message}`);
  }

  return await File.findByIdAndDelete(fileRecord._id);
};

module.exports = { 
  processFile, 
  deleteFile ,
  deleteFileByPath
};