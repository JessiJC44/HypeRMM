const fs = require('fs');
const path = require('path');

const dirsToSearch = ['/', '/scripts', '/app/applet', '/app/applet/scripts'];
let results = [];

dirsToSearch.forEach(dir => {
    try {
        console.log('Searching in:', dir);
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (file.length > 200) {
                results.push(fullPath);
            }
        }
    } catch (e) {
        console.log('Warning: could not search', dir, e.code);
    }
});

console.log('Oversized files found:', results.length);
results.forEach(f => {
    console.log('Deleting:', f);
    try {
        fs.unlinkSync(f);
    } catch (e) {
        console.log('Failed to delete', f, e.code);
    }
});
