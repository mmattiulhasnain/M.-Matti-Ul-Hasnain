const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1 & 2: Close motion.div on Auth and Access Denied
content = content.replace(/className="relative z-10 bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center"\n/g, 'className="relative z-10 bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center">\n');

// Wait, the original regex for Auth and Denied screens:
// I'll just find the exact missing >
content = content.replace(/flex-col items-center text-center"\s*<span/g, 'flex-col items-center text-center">\n<span');
content = content.replace(/hover:shadow-sm"\s*<span/g, 'hover:shadow-sm">\n<span'); // Error 3

// Wait, let's just do it cleanly via regex
content = content.replace(/className="bg-white border border-slate-200\/60 rounded-2xl p-4 flex flex-col justify-center transition-all hover:bg-slate-50\/80 hover:shadow-sm"\s*<span/g, 'className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-center transition-all hover:bg-slate-50/80 hover:shadow-sm">\n                <span');

content = content.replace(/flex-col items-center text-center"\s*<div/g, 'flex-col items-center text-center">\n          <div');

fs.writeFileSync('src/App.tsx', content);
