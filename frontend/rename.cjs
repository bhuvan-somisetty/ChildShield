const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/ChildShield A\.I\./gi, 'AlphaGuard A.I.')
    .replace(/ChildShield AI/gi, 'AlphaGuard AI')
    .replace(/ChildShield/g, 'AlphaGuard');
  
  // Exclude some backend domains or variable names if they got caught, but here we just blindly replace UI text
  // We can revert `childshield-1sd6` back
  newContent = newContent.replace(/AlphaGuard-1sd6\.onrender\.com/g, 'childshield-1sd6.onrender.com');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
