const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

// Настройка хранилища для Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const upload = multer({ storage });

// Раздача статических файлов из директории uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Маршрут для загрузки изображения
app.post('/upload', upload.single('files'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(200).json({ url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
