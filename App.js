const express = require('express');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5501;

app.use(express.static('public'));
app.use(cors());

// Middleware to handle file uploads
const storage = multer.diskStorage({
    destination: 'user_files/',
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original filename
    }
});

const upload = multer({ storage: storage });

app.post('/signup', (req, res) => {
    let body = "";
    req.on('data', (chunk) => {
        body += chunk.toString(); 
    });
    req.on('end', () => {
        const userData = JSON.parse(body); 
        console.log(userData);
        saveUserData(userData);
        res.sendStatus(200);
        
    });
});

function saveUserData(userData) {
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        const users = JSON.parse(data) || [];
        users.push(userData);
        fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Data saved to users.json successfully!');
        });
    });
}

app.post('/login', (req, res) => {
    let body = "";
    req.on('data', (chunk) => {
        body += chunk.toString();
    });
    req.on('end', () => {
        const userData = JSON.parse(body);
        userIsPresent(userData, (isValid) => {
            if (isValid) {
                res.sendStatus(200);
                
            } else {
                res.sendStatus(401);
            }
        });
    });
});

function userIsPresent(loginData, callback) {
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            callback(false); 
            return;
        }
        const users = JSON.parse(data) || [];
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === loginData.username && users[i].password === loginData.password) {
                callback(true); 
                return;
            }
        }
        callback(false); 
    });
}

app.get('/dashboard', (req, res) => {
    // Assuming users_data.json is in the same directory as your server file
    fs.readFile('users_data.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users_data.json:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        const jsonData = JSON.parse(data);
        res.json(jsonData);
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { filename } = req.file;
    const { text } = req.body; 

    // Update users_data.json
    const newData = { filename, text };
    fs.readFile('users_data.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users_data.json.');
        }

        let usersData = [];
        if (data) {
            try {
                usersData = JSON.parse(data);
            } catch (error) {
                return res.status(500).send('Error parsing users_data.json.');
            }
        }

        usersData.push(newData);

        fs.writeFile('users_data.json', JSON.stringify(usersData), (err) => {
            if (err) {
                return res.status(500).send('Error writing to users_data.json.');
            }

            res.status(200).send('File uploaded and data updated successfully.');
        });
    });
});

app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'user_files', filename);
    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});