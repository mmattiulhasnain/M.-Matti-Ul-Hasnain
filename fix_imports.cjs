const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { motion, AnimatePresence } from "motion/react";')) {
  content = content.replace(/import { onAuthStateChanged, User } from 'firebase\/auth';/, "import { onAuthStateChanged, User } from 'firebase/auth';\nimport { motion, AnimatePresence } from 'motion/react';");
}

fs.writeFileSync('src/App.tsx', content);
