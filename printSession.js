const fs = require('fs');
const path = require('path');

const sessionFolder = path.join(__dirname, 'auth_info_baileys');
const files = fs.readdirSync(sessionFolder);

files.forEach(file => {
    if (file.startsWith('session') && file.endsWith('.json')) {
        const sessionData = JSON.parse(fs.readFileSync(path.join(sessionFolder, file)));
        console.log('Session ID from file:', file);
        console.log(JSON.stringify(sessionData, null, 2));
    }
});
