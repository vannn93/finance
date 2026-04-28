const multer = require('multer');
const path = require('path');
const { processImageForOCR } = require('../utils/ocrHelper');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Hanya diperbolehkan format gambar (JPG/PNG)"));
    }
}).single('proof');

exports.uploadAndOCR = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Tidak ada file yang diupload' });
        }

        try {
            const nominal = await processImageForOCR(req.file.path);
            
            res.json({
                message: 'Upload berhasil',
                imageUrl: `/uploads/${req.file.filename}`,
                detectedNominal: nominal
            });
        } catch (error) {
            res.status(500).json({ message: 'Gagal memproses gambar untuk OCR', error: error.message });
        }
    });
};
