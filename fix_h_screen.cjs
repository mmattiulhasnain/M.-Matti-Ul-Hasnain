const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<div className="h-screen w-screen bg-slate-50 relative flex flex-col items-center justify-center overflow-hidden font-sans text-slate-900">/g, '<div className="min-h-screen w-full bg-slate-50 relative flex flex-col items-center justify-center font-sans text-slate-900">');

fs.writeFileSync('src/App.tsx', content);
