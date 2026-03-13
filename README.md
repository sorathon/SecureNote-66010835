# Conceptual Report: SecureNote Application

## 1. JS Engine vs. Runtime
การทำงานของแอปพลิเคชันนี้มีการแยกส่วนการประมวลผล JavaScript ออกเป็น 2 ฝั่ง ซึ่งทำงานในสภาพแวดล้อม (Runtime) ที่แตกต่างกัน:

* **Frontend (Client-Side):** โค้ด JavaScript (`script.js`) จะถูกรันบน **Browser Runtime** (เช่น Google Chrome) โดยมี **JS Engine** (เช่น **V8 Engine**) ทำหน้าที่แปลงโค้ด JS ให้เป็น Machine Code เพื่อประมวลผลบนเบราว์เซอร์ สิ่งที่ทำให้ Browser Runtime แตกต่างคือการมี "Web APIs" ให้ใช้งาน เช่น DOM API (สำหรับจัดการหน้าเว็บ) และ Fetch API (สำหรับดึงข้อมูล)
* **Backend (Server-Side):** โค้ด JavaScript (`server.js`) จะถูกรันบน **Node.js Runtime** ซึ่งขับเคลื่อนด้วย **V8 Engine** เช่นเดียวกัน แต่ Node.js จะไม่มี Web APIs อย่าง DOM ให้ใช้ โดยจะเตรียม API สำหรับฝั่งเซิร์ฟเวอร์มาให้แทน เช่น การจัดการระบบไฟล์ (File System), การจัดการ Network/HTTP และการเข้าถึง Environment Variables (`process.env`)

## 2. DOM (Document Object Model) Manipulation
ในโปรเจกต์นี้ฝั่ง Frontend ถูกเขียนด้วย Vanilla JS การอัปเดตหน้าจอจึงใช้การจัดการ DOM Tree โดยตรง (DOM Manipulation) โดยไม่ต้องรีโหลดหน้าเว็บใหม่:

* เมื่อผู้ใช้เพิ่มโน้ตใหม่ หรือเมื่อดึงข้อมูลมาจากเซิร์ฟเวอร์ โค้ดจะใช้คำสั่งอย่าง `document.createElement()` เพื่อสร้าง Node ใหม่ (เช่น แท็ก `<li>`, `<div>`, `<p>`) ขึ้นมาในหน่วยความจำ
* จากนั้นจะใส่ข้อมูลลงไป และนำไปต่อเข้ากับ DOM Tree ของหน้าเว็บที่มีอยู่แล้วผ่านคำสั่ง `appendChild()`
* กระบวนการนี้ทำให้เบราว์เซอร์ทำการจัดหน้าและวาดหน้าจอใหม่เฉพาะจุดที่มีการเปลี่ยนแปลง (Dynamic UI Update) ทำให้แอปพลิเคชันตอบสนองได้รวดเร็วและลื่นไหล

## 3. HTTP/HTTPS Protocol
เมื่อผู้ใช้กรอกข้อมูลและกดปุ่ม "Add Note" (Submit) จะเกิดกระบวนการ Request/Response Cycle ดังนี้:

1. **Request:** Frontend ขัดจังหวะการ Submit ฟอร์มปกติด้วย `e.preventDefault()` และใช้ Fetch API สร้าง HTTP `POST` Request ส่งไปยัง Backend
2. **Headers:** ใน Request นี้จะมีการส่ง Headers สำคัญไปด้วย คือ 
   * `Content-Type: application/json` (เพื่อบอกว่าข้อมูลที่แนบไปใน Body เป็นรูปแบบ JSON)
   * `Authorization: <SECRET_TOKEN>` (เพื่อยืนยันตัวตนว่ามีสิทธิ์ใช้งาน API)
3. **Response:** Backend รับข้อมูล ตรวจสอบ Token บันทึกข้อมูลลงฐานข้อมูล (PocketHost/JSON) และส่ง HTTP Status Code `201 Created` พร้อมข้อมูลโน้ตที่เพิ่งสร้างกลับมา
4. **Update:** Frontend รับ Response กลับมาแปลงเป็น JSON และนำไปอัปเดตแสดงผลลงบน DOM

**ความสำคัญของ HTTPS ใน Production:**
แม้ในการพัฒนาบน Localhost เราจะใช้ HTTP ธรรมดา แต่เมื่อนำระบบขึ้น Production จำเป็นต้องใช้ HTTPS เสมอ เพราะ HTTPS จะช่วยเข้ารหัสข้อมูล (Encryption in transit) ระหว่าง Client และ Server หากใช้ HTTP ธรรมดา ข้อมูลที่ส่งผ่านเครือข่าย เช่น เนื้อหาของโน้ต หรือรหัส `SECRET_TOKEN` ใน Header จะถูกส่งเป็น Plain Text ซึ่งเสี่ยงต่อการถูกแฮ็กเกอร์ดักจับข้อมูลและขโมยไปใช้งานได้ (Man-in-the-middle attack)

## 4. Environment Variables
ในโปรเจกต์นี้ เราเก็บตัวแปรที่เก็บความลับอย่าง `SECRET_TOKEN` ไว้ในไฟล์ `.env` ที่ฝั่ง Backend และไม่นำขึ้นระบบ Version Control (เช่น Git)

* **ทำไมต้องเก็บใน Backend `.env`:** เพราะฝั่ง Backend เป็นสภาพแวดล้อมที่ปลอดภัย (Secure Environment) ผู้ใช้งานทั่วไปไม่สามารถเข้ามาดูโค้ดหรือไฟล์ในเซิร์ฟเวอร์ได้ 
* **หากนำไปไว้ใน Frontend จะเกิดอะไรขึ้น:** โค้ด Frontend ทั้งหมดจะต้องถูกดาวน์โหลดไปรันที่เครื่องของผู้ใช้ (Browser) หากเรา Hardcode ตัว `SECRET_TOKEN` ไว้ในฝั่ง Frontend ผู้ใช้ทุกคนจะสามารถเปิด Developer Tools (F12) หรือดู Page Source เพื่ออ่านค่า Token นั้นได้อย่างง่ายดาย ซึ่งจะนำไปสู่ความเสี่ยงที่ผู้ไม่หวังดีจะขโมย Token นั้นไปใช้ยิง API ของเราโดยตรง เพื่อลบหรือสร้างข้อมูลขยะได้

---
# SecureNote Application 🔒

แอปพลิเคชันจดโน้ตแบบ Full-stack ที่แยกการทำงานระหว่างฝั่ง Client และ Server ชัดเจน พร้อมระบบ Authentication และการบันทึกข้อมูลแบบ 2 ชั้น (PocketHost API + Local JSON Backup)

--

## 🌍 Live Demo (ทดลองใช้งานจริง)

โปรเจกต์นี้ได้รับการ Deploy ขึ้นบนระบบ Cloud เรียบร้อยแล้ว สามารถทดลองใช้งานได้ที่นี่:

* **Frontend (UI หน้าเว็บ):** [SecureNote App](https://secure-note-66010835-81i40hsi7-sorthons-projects.vercel.app/)
* **Backend (API Server):** [SecureNote API (Render)](https://securenote-66010835.onrender.com)

--

## ⚙️ Prerequisites (สิ่งที่ต้องมีสำหรับการรัน Local)

ก่อนเริ่มต้นรันโปรเจกต์ในเครื่องของคุณ กรุณาตรวจสอบให้แน่ใจว่าได้ติดตั้งเครื่องมือเหล่านี้แล้ว:
* [Node.js](https://nodejs.org/) (จำเป็นต้องติดตั้งเพื่อรันเซิร์ฟเวอร์ Backend)
* [Git](https://git-scm.com/) (สำหรับ Clone โปรเจกต์)
* **Code Editor** เช่น [VS Code](https://code.visualstudio.com/) (แนะนำให้ติดตั้ง Extension "Live Server" เพื่อความสะดวกในการรัน Frontend)

--

# 🚀 Installation & Setup (ขั้นตอนการติดตั้งและรันโปรเจกต์แบบ Local)

หากต้องการทดสอบรันโปรเจกต์นี้ในเครื่องของคุณเอง ให้ทำตามขั้นตอนดังต่อไปนี้:
## การตั้งค่า Backend (Node.js Server)
### ขั้นตอนที่ 0: ดาวน์โหลดโปรเจกต์
เปิด Terminal และรันคำสั่งเพื่อ Clone โปรเจกต์มาที่เครื่องของคุณ:
```bash
git clone <ใส่-URL-GitHub-ของคุณที่นี่>
cd <ชื่อโฟลเดอร์โปรเจกต์ของคุณ>
```
### ขั้นตอนที่ 1: ติดตั้ง Dependencies
```bash
npm install
```

### ขั้นตอนที่ 2:เริ่มการทำงานของเซิร์ฟเวอร์ Backend
```bash
node server.js
```
## การตั้งค่า Frontend (หน้าเว็บ Client)
### (ทางเลือกแนะนำ) หากใช้งาน VS Code ให้คลิกขวาที่ไฟล์ index.html แล้วเลือก "Open with Live Server"
