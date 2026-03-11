const API_URL = 'http://localhost:3000/api/notes';

const CLIENT_TOKEN = 'my-super-secret-key'; 

const noteForm = document.getElementById('note-form');
const noteList = document.getElementById('note-list');
const errorMessage = document.getElementById('error-message');
const loadingIndicator = document.getElementById('loading');


const toggleLoading = (show) => {
    loadingIndicator.classList.toggle('hidden', !show);
};


const showError = (msg) => {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 3000);
};


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

const renderNotes = (notes) => {
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="note-content">
                <strong>${note.title}</strong>
                <p>${note.content}</p>
            </div>
            <button onclick="deleteNote('${note.id}')">Delete</button>
        `;
        noteList.appendChild(li);
    });
};


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
                'Authorization': CLIENT_TOKEN 
            },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) throw new Error(`Error: ${response.status} - Unauthorized`);

        document.getElementById('title').value = '';
        document.getElementById('content').value = '';
        fetchNotes();
    } catch (err) {
        showError(err.message); 
    } finally {
        toggleLoading(false);
    }
});


const deleteNote = async (id) => {
    toggleLoading(true);
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': CLIENT_TOKEN 
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



fetchNotes();