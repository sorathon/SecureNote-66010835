const API_URL = 'http://localhost:3000/api/notes';
// สำหรับทดสอบ เราจะใส่ Token ไว้ตรงนี้เพื่อใช้ส่งใน Header [cite: 77]
// คำเตือน: ในโลกความเป็นจริง ไม่ควรเก็บ Secret ไว้ใน Frontend Code [cite: 50, 51]
const CLIENT_TOKEN = 'my-super-secret-key'; 

const noteForm = document.getElementById('note-form');
const noteList = document.getElementById('note-list');
const errorMessage = document.getElementById('error-message');
const loadingIndicator = document.getElementById('loading');

// ฟังก์ชันเปิด/ปิด Loading State [cite: 92]
const toggleLoading = (show) => {
    loadingIndicator.classList.toggle('hidden', !show);
};

// ฟังก์ชันแสดง Error [cite: 41]
const showError = (msg) => {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 3000);
};

// ใช้ Fetch API ดึงข้อมูลจาก Backend [cite: 39, 76]
const fetchNotes = async () => {
    toggleLoading(true);
    try {
        const response = await fetch(API_URL);
        const notes = await response.json();
        renderNotes(notes);
    } catch (err) {
        showError('Failed to fetch notes');
    } finally {
        toggleLoading(false);
    }
};

// จัดการการ Render UI อัตโนมัติด้วย DOM Manipulation [cite: 37]
const renderNotes = (notes) => {
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${note.title}</strong>
                <p>${note.content}</p>
            </div>
            <button onclick="deleteNote(${note.id})">Delete</button>
        `;
        noteList.appendChild(li);
    });
};

// การสร้างโน้ตใหม่และส่ง Authorization header [cite: 28, 77]
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    toggleLoading(true);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': CLIENT_TOKEN // ส่ง Token [cite: 77]
            },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) throw new Error(`Error: ${response.status} - Unauthorized`);

        document.getElementById('title').value = '';
        document.getElementById('content').value = '';
        fetchNotes();
    } catch (err) {
        showError(err.message); // แสดงข้อความ error แก่ผู้ใช้ [cite: 41]
    } finally {
        toggleLoading(false);
    }
});

// การลบโน้ตและส่ง Authorization header [cite: 29]
const deleteNote = async (id) => {
    toggleLoading(true);
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': CLIENT_TOKEN // ส่ง Token [cite: 77]
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete note');
        fetchNotes();
    } catch (err) {
        showError(err.message);
    } finally {
        toggleLoading(false);
    }
};

// ดึงข้อมูลเมื่อโหลดหน้าเว็บ
fetchNotes();