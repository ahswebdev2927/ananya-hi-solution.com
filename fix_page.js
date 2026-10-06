const fs = require('fs');

let content = fs.readFileSync('src/app/page.js', 'utf8');

// 1. Add import
if (!content.includes('GlobalFooter')) {
    content = content.replace('import Header from "./components/Header";', 'import Header from "./components/Header";\nimport GlobalFooter from "./components/GlobalFooter";');
}

// 2. Remove Chat State
const chatStateStart = content.indexOf('  // Chat Widget State');
const chatStateEnd = content.indexOf('  return (');

if (chatStateStart !== -1 && chatStateEnd !== -1) {
    content = content.slice(0, chatStateStart) + content.slice(chatStateEnd);
}

// 3. Replace Footer and Chat HTML
const footerStart = content.indexOf('<footer id="contact" className="footer">');
const footerEnd = content.lastIndexOf('</>');

if (footerStart !== -1 && footerEnd !== -1) {
    // We want to replace from footerStart up to just before </>
    content = content.slice(0, footerStart) + '      <GlobalFooter />\n    ' + content.slice(footerEnd);
}

fs.writeFileSync('src/app/page.js', content, 'utf8');
console.log('Successfully updated page.js');
