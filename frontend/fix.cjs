const fs = require('fs');
const path = require('path');

const dir = 'src';
const replacements = {
  'Ã¢â‚¬â€ ': '—',
  'Ã¢â‚¬â„¢': '\'',
  'Ã¢Å“â€¦': '\u{2705}',
  'Ã¢â€ â‚¬': '─',
  'Ã°Å¸â€œÂº': '\u{1F4FA}',
  'Ã°Å¸â€œÂ¸': '\u{1F4F8}',
  'Ã°Å¸â€™Â¬': '\u{1F4AC}',
  'Ã°Å¸Å½Âµ': '\u{1F3B5}',
  'Ã°Å¸â€˜Â»': '\u{1F47B}',
  'Ã°Å¸Å’Â ': '\u{1F310}',
  'Ã°Å¸Å½Â®': '\u{1F3AE}',
  'Ã°Å¸Å½Â§': '\u{1F3A7}',
  'Ã¢Å“Ë†Ã¯Â¸Â ': '\u{2708}\u{FE0F}',
  'Ã°Å¸â€“Â¼Ã¯Â¸Â ': '\u{1F5BC}\u{FE0F}',
  'Ã°Å¸â€œÅ ': '\u{1F4CA}',
  'Ã¢Â Â°': '\u{23F3}',
  'Ã°Å¸â€ â€™': '\u{1F512}',
  'Ã¢Å“Â¨': '\u{2728}',
  'ðŸ  ': '\u{1F3E0}',
  'ðŸ «': '\u{1F3EB}',
  'ðŸ‘¨â€ ðŸ‘©â€ ðŸ‘§': '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}',
  'ðŸ ¥': '\u{1F3E5}',
  'ðŸ“ ': '\u{1F4CD}',
  'ðŸ§‘': '\u{1F9D1}',
  'ðŸš—': '\u{1F697}',
  'ðŸš¶': '\u{1F6B6}',
  'ðŸ”‹': '\u{1F50B}',
  'Ã¢â€œ': '✨',
  'Â·': '·'
};

function processDir(d) {
  const files = fs.readdirSync(d);
  for (const f of files) {
    const full = path.join(d, f);
    if (fs.statSync(full).isDirectory()) {
      processDir(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [bad, good] of Object.entries(replacements)) {
        if (content.includes(bad)) {
          content = content.split(bad).join(good);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Fixed:', full);
      }
    }
  }
}

processDir(dir);
console.log('Encoding fix complete!');
