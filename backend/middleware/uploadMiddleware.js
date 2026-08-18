import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('File received:', file.originalname, file.mimetype);
  
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, JPEG, PNG, and DOC files are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: fileFilter,
});

const uploadToCloudinary = (buffer, folder = 'professionals', publicId = null) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId || `doc_${Date.now()}`,
        resource_type: 'auto', 
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(stream);
  });
};

export const uploadMultiple = upload.array('documents', 10);
export const uploadSingle = upload.single('document');

export const uploadFilesToCloudinary = async (files, folder = 'professionals') => {
  try {
    const uploadPromises = files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, folder);
      return {
        title: file.originalname,
        url: result.secure_url, 
        type: file.fieldname || 'license',
        fileName: file.originalname,
        mimeType: file.mimetype,
        publicId: result.public_id,
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default upload;