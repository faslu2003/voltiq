const multer = require('multer');
const crypto = require('crypto');


const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        cb(null, crypto.randomUUID() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {

    const allowedTypes = ["image/jpeg", "image/png"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only JPG and PNG images are allowed."));
    }
};

const upload = multer({ storage, fileFilter });





module.exports = upload;