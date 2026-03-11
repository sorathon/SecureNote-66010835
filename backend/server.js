const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// โหลดตัวแปรจากไฟล์ .env 
dotenv.config();

const app = express();
// เปิดใช้งาน CORS เพื่อป้องกันข้อผิดพลาดการเชื่อมต่อข้ามโดเมน 
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = process.env.SECRET_TOKEN;

// ฐานข้อมูลจำลอง (In-memory) สำหรับเก็บโน้ต [cite: 16]
let notes = [];
let currentId = 1;

// Middleware สำหรับตรวจสอบ Authorization Header [cite: 28, 29]
const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== SECRET_TOKEN) {
        // ส่งคืนสถานะ 401 หากไม่ได้รับอนุญาต [cite: 30]
        return res.status(401).json({ error: "Unauthorized access" });
    }
    next();
};

// Endpoint: ดึงโน้ตทั้งหมด [cite: 27]
app.get('/api/notes', (req, res) => {
    res.status(200).json(notes); // ส่งคืนสถานะ 200 OK [cite: 30]
});

// Endpoint: สร้างโน้ตใหม่ (ต้องการ Auth) [cite: 28]
app.post('/api/notes', checkAuth, (req, res) => {
    const { title, content } = req.body;
    const newNote = { id: currentId++, title, content };
    notes.push(newNote);
    res.status(201).json(newNote); // ส่งคืนสถานะ 201 Created [cite: 30]
});

// Endpoint: ลบโน้ตตาม ID (ต้องการ Auth) [cite: 29]
app.delete('/api/notes/:id', checkAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) {
        // ส่งคืนสถานะ 404 หากไม่พบโน้ต [cite: 30]
        return res.status(404).json({ error: "Note Not Found" });
    }
    notes.splice(index, 1);
    res.status(200).json({ message: "Note deleted successfully" });
});

// เริ่มการทำงานของเซิร์ฟเวอร์บน Node.js Runtime [cite: 21]
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});