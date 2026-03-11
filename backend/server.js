const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises; 
const path = require('path');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = process.env.SECRET_TOKEN;
const POCKETHOST_TOKEN = process.env.POCKETHOST_TOKEN;
const POCKETHOST_URL = 'https://app-tracking.pockethost.io/api/collections/notes/records';


const DATA_FILE = path.join(__dirname, 'notes.json');


const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== SECRET_TOKEN) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    next();
};


const readNotes = async () => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        
        return [];
    }
};

const writeNotes = async (notes) => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2));
    } catch (error) {
        console.error("Error writing local file:", error);
    }
};


app.get('/api/notes', async (req, res) => {
    try {
        
        const response = await fetch(POCKETHOST_URL, {
            method: 'GET',
            headers: { 
                'Authorization': POCKETHOST_TOKEN 
            }
        });
        const data = await response.json();
        const pocketHostNotes = data.items || [];
        
        

        res.status(200).json(pocketHostNotes); 
    } catch (error) {
        console.error("Fetch Error (PocketHost):", error);
        
        console.log("Falling back to local notes.json...");
        const localNotes = await readNotes();
        res.status(200).json(localNotes);
    }
});


app.post('/api/notes', checkAuth, async (req, res) => {
    const { title, content } = req.body;
    
    try {
       
        const response = await fetch(POCKETHOST_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': POCKETHOST_TOKEN 
            },
            body: JSON.stringify({ title, content, user_id: 2 }) 
        });
        const newNote = await response.json();

       
        const localNotes = await readNotes();
        localNotes.push({
            id: newNote.id, 
            title: title,
            content: content
        });
        await writeNotes(localNotes);

        res.status(201).json(newNote); 
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ error: "Failed to create note" });
    }
});


app.delete('/api/notes/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
       
        const response = await fetch(`${POCKETHOST_URL}/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': POCKETHOST_TOKEN 
            }
        });
        
        if (!response.ok) {
            return res.status(404).json({ error: "Note Not Found" }); 
        }

        let localNotes = await readNotes();
        localNotes = localNotes.filter(n => n.id !== id);
        await writeNotes(localNotes);

       
        res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete note" });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});