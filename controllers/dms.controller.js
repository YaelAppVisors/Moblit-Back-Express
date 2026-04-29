const dmsService = require('../services/dms.service');

const uploadFile = async (req, res) => {
  try {
    const result = await dmsService.processFile(req.file);
    console.log(result);
    
    res.status(201).json({
      success: true,
      url: result.url,
      details: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeFile = async (req, res) => {
  try {
    const { id } = req.params;
    await dmsService.deleteFile(id);

    res.status(200).json({
      success: true,
      message: "Archivo eliminado correctamente tanto del disco como de la DB"
    });
  } catch (error) {
    const status = error.message.includes('encontrado') ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const removeFileByPath = async (req, res) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ success: false, message: "El path es requerido" });
    }

    await dmsService.deleteFileByPath(path);

    res.status(200).json({
      success: true,
      message: "Archivo eliminado correctamente tanto del disco como de la DB"
    });
  } catch (error) {
    const status = error.message.includes('encontrado') ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { uploadFile,removeFile,removeFileByPath };
