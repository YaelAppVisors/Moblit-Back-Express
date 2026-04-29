const router = require('express').Router();
const upload = require('../middlewares/upload.middleware');
const dmsController = require('../controllers/dms.controller');

router.post('/upload', upload.single('document'), dmsController.uploadFile);
router.delete('/delete/:id', dmsController.removeFile);
router.delete('/delete-by-path', dmsController.removeFileByPath);
module.exports = router;
