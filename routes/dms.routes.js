const router = require('express').Router();
const upload = require('../middlewares/upload.middleware');
const dmsController = require('../controllers/dms.controller');

router.post('/upload', upload.single('document'), dmsController.uploadFile);
router.delete('/delete/:id', dmsController.removeFile);
module.exports = router;
