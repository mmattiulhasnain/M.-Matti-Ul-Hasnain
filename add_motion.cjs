const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports
if (!content.includes('motion/react')) {
  content = content.replace(/import { onAuthStateChanged, User } from 'firebase\/auth';/, "import { onAuthStateChanged, User } from 'firebase/auth';\nimport { motion, AnimatePresence } from 'motion/react';");
}

// 2. Animate Auth Screen
content = content.replace(
  /<div className="relative z-10 bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center">/,
  '<motion.div \n          initial={{ opacity: 0, scale: 0.95, y: 10 }}\n          animate={{ opacity: 1, scale: 1, y: 0 }}\n          transition={{ duration: 0.4, ease: "easeOut" }}\n          className="relative z-10 bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center"'
);
content = content.replace(
  /<\/button>\n        <\/div>\n      <\/div>\n    \);\n  }\n\n  const isAllowed = user\.email/,
  '</button>\n        </motion.div>\n      </div>\n    );\n  }\n\n  const isAllowed = user.email'
);

// 3. Animate Access Denied Screen
content = content.replace(
  /<div className="relative z-10 bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center">/g,
  '<motion.div \n          initial={{ opacity: 0, scale: 0.95, y: 10 }}\n          animate={{ opacity: 1, scale: 1, y: 0 }}\n          transition={{ duration: 0.4, ease: "easeOut" }}\n          className="relative z-10 bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center"'
);
content = content.replace(
  /<\/button>\n        <\/div>\n      <\/div>\n    \);\n  }\n\n  return \(/,
  '</button>\n        </motion.div>\n      </div>\n    );\n  }\n\n  return ('
);

// 4. Animate Summary Cards (Stagger)
content = content.replace(
  /\{roleStats.map\(stat => \(/,
  '{roleStats.map((stat, i) => ('
);
content = content.replace(
  /<div key=\{stat\.label\} className="bg-white border border-slate-200\/60 rounded-2xl p-4 flex flex-col justify-center transition-all hover:bg-slate-50\/80">/,
  '<motion.div \n                key={stat.label}\n                initial={{ opacity: 0, y: 10 }}\n                animate={{ opacity: 1, y: 0 }}\n                transition={{ duration: 0.3, delay: i * 0.05 }}\n                className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-center transition-all hover:bg-slate-50/80 hover:shadow-sm"'
);
content = content.replace(
  /<\/span>\n                <\/div>\n              <\/div>\n            \)\)}/,
  '</span>\n                </div>\n              </motion.div>\n            ))}'
);

// 5. Animate Table Rows (Basic fade for performance)
content = content.replace(
  /\{sortedRecords\.map\(record => \(/,
  '{sortedRecords.map((record, i) => ('
);
content = content.replace(
  /<tr key=\{record\.id\} className=\{`border-b border-slate-100\/80 transition-colors \$\{/,
  '<motion.tr \n                    initial={{ opacity: 0 }}\n                    animate={{ opacity: 1 }}\n                    transition={{ duration: 0.2 }}\n                    key={record.id} \n                    className={`border-b border-slate-100/80 transition-colors ${'
);
content = content.replace(
  /<\/td>\n                  <\/tr>\n                \)\)}/,
  '</td>\n                  </motion.tr>\n                ))}'
);

// 6. Animate Add Modal
content = content.replace(
  /\{isAddModalOpen && \(/,
  '<AnimatePresence>\n      {isAddModalOpen && ('
);
content = content.replace(
  /<div className="fixed inset-0 z-50 flex items-center justify-center p-4">/,
  '<div className="fixed inset-0 z-50 flex items-center justify-center p-4">\n          <motion.div \n            initial={{ opacity: 0 }}\n            animate={{ opacity: 1 }}\n            exit={{ opacity: 0 }}\n            onClick={() => setIsAddModalOpen(false)} \n            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" \n          />'
);
content = content.replace(
  /<div className="absolute inset-0 bg-slate-900\/50 backdrop-blur-sm" onClick=\{\(\) => setIsAddModalOpen\(false\)}><\/div>/,
  ''
);
content = content.replace(
  /<div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200\/50 w-full max-w-2xl overflow-hidden flex flex-col max-h-\[90vh\] animate-in fade-in zoom-in duration-200">/,
  '<motion.div \n            initial={{ opacity: 0, scale: 0.95, y: 10 }}\n            animate={{ opacity: 1, scale: 1, y: 0 }}\n            exit={{ opacity: 0, scale: 0.95, y: 10 }}\n            transition={{ duration: 0.2, ease: "easeOut" }}\n            className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"'
);
content = content.replace(
  /<\/form>\n            <\/div>\n            <div className="p-5 border-t border-slate-200\/60 flex justify-end gap-3 bg-slate-50\/50">/,
  '</form>\n            </div>\n            <div className="p-5 border-t border-slate-200/60 flex justify-end gap-3 bg-slate-50/50 z-20">'
);
content = content.replace(
  /<\/div>\n        <\/div>\n      \)\}\n    <\/div>\n  \);\n}/,
  '</div>\n          </motion.div>\n        </div>\n      )}\n      </AnimatePresence>\n    </div>\n  );\n}'
);


fs.writeFileSync('src/App.tsx', content);
