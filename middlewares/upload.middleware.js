const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/', 
  filename: (req, file, cb) => {
    const suffix = Date.now() + '-' + Math.random() * 1e9;
    cb(null, `${file.fieldname}-${suffix}${path.extname(file.originalname)}`);
  }
});

module.exports = multer({ storage });
