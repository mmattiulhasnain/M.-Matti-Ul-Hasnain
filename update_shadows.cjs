const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace table hover row style with a very soft slate
content = content.replace(/hover:bg-slate-50/g, 'hover:bg-slate-50/80');

// Replace standard container shadow-2xl with a professional softer shadow
content = content.replace(/shadow-2xl/g, 'shadow-xl shadow-slate-200/50');

// Header borders - make them crisp
content = content.replace(/border-slate-200/g, 'border-slate-200/60');
content = content.replace(/border-slate-100/g, 'border-slate-100/80');

fs.writeFileSync('src/App.tsx', content);
