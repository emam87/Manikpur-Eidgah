import multer from 'multer';

// Multer memory storage (keeps file in memory Buffer for Sharp processing and R2 upload)
const storage = multer.memoryStorage();

// Maximum upload file size: 12 MB
const MAX_UPLOAD_SIZE = 12 * 1024 * 1024;

export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('শুধুমাত্র ছবি আপলোড করা যাবে (JPEG, PNG, WebP)।'), false);
    }
  },
}).single('photo');

export const uploadSingleDocument = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('শুধুমাত্র PDF বা ছবি ফাইল আপলোড করা যাবে।'), false);
    }
  },
}).single('file');

export const uploadMultiImages = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 20 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('শুধুমাত্র ছবি আপলোড করা যাবে।'), false);
    }
  },
}).array('photos', 20);

export const uploadDesignImages = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 20 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('শুধুমাত্র ছবি ফাইল আপলোড করা যাবে।'), false);
    }
  },
}).array('images', 20);

export const uploadCsvFile = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB for CSV
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('শুধুমাত্র CSV (.csv) ফাইল আপলোড করা যাবে।'), false);
    }
  },
}).single('csv_file');

