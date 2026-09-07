const fs = require('fs');
let content = fs.readFileSync('App_backup.tsx', 'utf8');

// Error 1: 447:10: ERROR: Unexpected closing "div" tag does not match opening "motion.div" tag
// We change the opening tag of Access Denied container to a regular div.
content = content.replace(/<motion\.div initial=\{\{ opacity: 0, scale: 0\.95, y: 10 \}\} animate=\{\{ opacity: 1, scale: 1, y: 0 \}\} transition=\{\{ duration: 0\.4, ease: "easeOut" \}\} className="relative z-10 bg-white  border border-slate-200\/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200\/50 flex flex-col items-center text-center">/, 
'<div className="relative z-10 bg-white border border-slate-200/60 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">');

// Error 2: 543:16: ERROR: Unexpected closing "div" tag does not match opening "motion.div" tag
// We change the opening tag for roleStats to a regular div
content = content.replace(/<motion\.div key=\{stat\.label\} initial=\{\{ opacity: 0, y: 10 \}\} animate=\{\{ opacity: 1, y: 0 \}\} transition=\{\{ duration: 0\.3, delay: i \* 0\.05 \}\}/g, 
'<div key={stat.label}');

// Error 3: 577:20: ERROR: Unexpected closing "motion.tr" tag does not match opening "tr" tag
// Change opening <tr key={record.id} in the table header to motion.tr? Wait, the error is the closing tag is motion.tr but opening is tr. 
// Let's change the closing tag to </tr> in the table header.
content = content.replace(/<th className="p-4 font-medium whitespace-nowrap text-right">Links<\/th>\n                    <\/motion\.tr>/g, 
'<th className="p-4 font-medium whitespace-nowrap text-right">Links</th>\n                  </tr>');

// Error 4: 624:22: ERROR: Unexpected closing "motion.tr" tag does not match opening "tr" tag
// In the tbody, we have <tr key={record.id} className="hover... but closing is </motion.tr>
// Let's change opening to motion.tr
content = content.replace(/<tr \n                      key=\{record\.id\}\n                      className="hover:bg-slate-50\/80 transition-colors group"\n                    >/g, 
'<motion.tr \n                      key={record.id}\n                      initial={{ opacity: 0, y: 10 }}\n                      animate={{ opacity: 1, y: 0 }}\n                      exit={{ opacity: 0, scale: 0.95 }}\n                      transition={{ duration: 0.2 }}\n                      className="hover:bg-slate-50/80 transition-colors group"\n                    >');

// Error 5: 626:37: ERROR: Unterminated regular expression
// It says 
// 624|                      </motion.tr>
// 625|                    ))
// 626|                    </AnimatePresence>}
// Wait! `</AnimatePresence>}` ? The `}` is invalid JSX syntax if not preceded by `{`.
// The correct code should be just `</AnimatePresence>`!
content = content.replace(/<\/AnimatePresence>\}/g, '</AnimatePresence>');

fs.writeFileSync('src/App.tsx', content);
