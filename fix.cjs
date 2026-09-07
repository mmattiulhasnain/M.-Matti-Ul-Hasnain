const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="relative z-10 bg-white  border border-slate-200/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center"> 
// with div
content = content.replace(/<motion\.div initial=\{\{ opacity: 0, scale: 0\.95, y: 10 \}\} animate=\{\{ opacity: 1, scale: 1, y: 0 \}\} transition=\{\{ duration: 0\.4, ease: "easeOut" \}\} className="relative z-10 bg-white  border border-slate-200\/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200\/50 flex flex-col items-center text-center">/g, '<div className="relative z-10 bg-white border border-slate-200/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">');

// Replace <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} with div
content = content.replace(/<motion\.div key=\{stat\.label\} initial=\{\{ opacity: 0, y: 10 \}\} animate=\{\{ opacity: 1, y: 0 \}\} transition=\{\{ duration: 0\.3, delay: i \* 0\.05 \}\}/g, '<div key={stat.label}');

// Replace motion.tr with tr globally
content = content.replace(/<motion\.tr/g, '<tr');
content = content.replace(/<\/motion\.tr>/g, '</tr>');

// Remove AnimatePresence completely
content = content.replace(/<AnimatePresence>/g, '');
content = content.replace(/<\/AnimatePresence>}/g, '}');
content = content.replace(/<\/AnimatePresence>/g, '');

// Save
fs.writeFileSync('src/App.tsx', content);
