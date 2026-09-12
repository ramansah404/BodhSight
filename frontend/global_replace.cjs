const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace bg-[#0B1120] with bg-surface
  content = content.replace(/bg-\[\#0B1120\]/g, 'bg-surface');
  
  // Replace border-slate-800/60 and border-slate-800 with border-border
  content = content.replace(/border-slate-800\/60/g, 'border-border');
  content = content.replace(/border-slate-800/g, 'border-border');
  content = content.replace(/border-slate-700\/50/g, 'border-border');
  
  // Replace text-white with text-text-primary (but NOT in bg-gradient)
  // This is tricky. We'll do it manually or carefully.
  // Actually, I'll just change the main ones:
  // bg-slate-900/40 -> bg-surface-secondary
  content = content.replace(/bg-slate-900\/40/g, 'bg-surface-secondary');
  content = content.replace(/bg-slate-800\/30/g, 'bg-surface-secondary');
  content = content.replace(/bg-slate-800\/50/g, 'bg-surface-hover');
  
  // Replace specific text-white in cards that we know are text-text-primary in light mode
  // The easiest way is to target `text-white` when it's next to `font-bold` or similar in a non-gradient context.
  // Instead of risking text-white, let's leave text-white alone for a moment and replace `bg-white` first.
  content = content.replace(/bg-white/g, 'bg-surface');
  content = content.replace(/text-black/g, 'text-text-primary');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
