const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The main layout wrapper animations
content = content.replace(/<div className="relative w-full min-h-screen flex flex-col bg-white">/, '<motion.div \n      initial={{ opacity: 0 }}\n      animate={{ opacity: 1 }}\n      transition={{ duration: 0.5 }}\n      className="relative w-full min-h-screen flex flex-col bg-white"\n    >');

// Match the closing div of the main wrapper. It's tricky to regex, let's look for the final </div></div>\n  );
content = content.replace(/<\/div>\n    <\/div>\n  \);\n}/, '    </motion.div>\n    </div>\n  );\n}');

// Table rows animation
content = content.replace(/<tbody className="divide-y divide-slate-100">/, '<tbody className="divide-y divide-slate-100">\n                  <AnimatePresence>');

content = content.replace(/<tr \n                      key=\{record\.id\}/, '<motion.tr \n                      key={record.id}\n                      initial={{ opacity: 0, y: 10 }}\n                      animate={{ opacity: 1, y: 0 }}\n                      exit={{ opacity: 0, scale: 0.95 }}\n                      transition={{ duration: 0.2 }}');

content = content.replace(/<\/tr>\n                  \)\)/, '</motion.tr>\n                  ))\n                  </AnimatePresence>');

// Dashboard stats animation
content = content.replace(/<div key=\{stat\.label\} className="bg-white border border-slate-200\/60 rounded-2xl p-4 flex flex-col justify-center transition-all hover:bg-slate-50\/80">/, '<motion.div \n                key={stat.label} \n                initial={{ opacity: 0, y: 20 }}\n                animate={{ opacity: 1, y: 0 }}\n                transition={{ delay: index * 0.1 }}\n                className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-center transition-colors hover:bg-slate-50/80"\n              >');
content = content.replace(/\{roleStats\.map\(stat => \(/, '{roleStats.map((stat, index) => (');
content = content.replace(/<\/div>\n            \)\)}/, '</motion.div>\n            ))}');

fs.writeFileSync('src/App.tsx', content);
