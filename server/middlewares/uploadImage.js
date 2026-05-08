import multer from "multer"
import path from "path"
import fs from "fs"

// Ensure uploads directory exists
const uploadDir = "uploads"
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + "_" + file.fieldname + "_" + file.originalname.replace(/\s+/g, '_')
    cb(null, fileName)
  },
})

// function to sanitize files and send error for unsupported files
function sanitizeFile(file, cb) {
  // Define the allowed extension
  const fileExts = [".png", ".jpg", ".jpeg", ".gif", ".webp"]

  // Check allowed extensions
  const isAllowedExt = fileExts.includes(
    path.extname(file.originalname.toLowerCase())
  )

  // Mime type must be an image
  const isAllowedMimeType = file.mimetype.startsWith("image/")

  if (isAllowedExt && isAllowedMimeType) {
    return cb(null, true) // no errors
  } else {
    // pass error msg to callback, which can be displaye in frontend
    cb(new Error("Error: File type not allowed!"))
  }
}

// our middleware
export const uploadImage = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    sanitizeFile(file, callback)
  },
  limits: {
    fileSize: 1024 * 1024 * 5, // 5mb file size
  },
})

