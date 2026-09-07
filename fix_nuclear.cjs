const fs = require('fs');
let content = fs.readFileSync('App_backup.tsx', 'utf8');

// Strip out ALL motion tags to be absolutely sure.
content = content.replace(/<motion\.div[^>]*>/g, '<div>');
content = content.replace(/<\/motion\.div>/g, '</div>');

content = content.replace(/<motion\.tr[^>]*>/g, '<tr>');
content = content.replace(/<\/motion\.tr>/g, '</tr>');

content = content.replace(/<AnimatePresence[^>]*>/g, '');
content = content.replace(/<\/AnimatePresence>}/g, '}');
content = content.replace(/<\/AnimatePresence>/g, '');

content = content.replace(/<motion\.h1[^>]*>/g, '<h1>');
content = content.replace(/<\/motion\.h1>/g, '</h1>');

content = content.replace(/<motion\.p[^>]*>/g, '<p>');
content = content.replace(/<\/motion\.p>/g, '</p>');

content = content.replace(/<motion\.button[^>]*>/g, '<button>');
content = content.replace(/<\/motion\.button>/g, '</button>');

fs.writeFileSync('src/App.tsx', content);
