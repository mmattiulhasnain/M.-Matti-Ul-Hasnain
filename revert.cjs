const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<motion\.div/g, '<div');
content = content.replace(/<\/motion\.div>/g, '</div>');
content = content.replace(/<motion\.tr/g, '<tr');
content = content.replace(/<\/motion\.tr>/g, '</tr>');
content = content.replace(/<motion\.button/g, '<button');
content = content.replace(/<\/motion\.button>/g, '</button>');
content = content.replace(/<motion\.p/g, '<p');
content = content.replace(/<\/motion\.p>/g, '</p>');
content = content.replace(/<motion\.span/g, '<span');
content = content.replace(/<\/motion\.span>/g, '</span>');

content = content.replace(/initial=\{\{[^}]*\}\}/g, '');
content = content.replace(/animate=\{\{[^}]*\}\}/g, '');
content = content.replace(/exit=\{\{[^}]*\}\}/g, '');
content = content.replace(/transition=\{\{[^}]*\}\}/g, '');
content = content.replace(/whileHover=\{\{[^}]*\}\}/g, '');
content = content.replace(/whileTap=\{\{[^}]*\}\}/g, '');

fs.writeFileSync('src/App.tsx', content);
