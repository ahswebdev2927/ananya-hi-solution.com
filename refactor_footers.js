const fs = require('fs');
const path = require('path');

const srcAppPath = path.join(__dirname, 'src', 'app');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('components') && !file.includes('api')) {
            results = results.concat(walkDir(file));
        } else if (stat && !stat.isDirectory()) {
            if (file.endsWith('page.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir(srcAppPath);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if file has footer
    if (content.includes('<footer id="contact" className="footer">') || content.includes('<footer className="footer">')) {
        
        // Calculate relative path for import
        const relativePathToApp = path.relative(path.dirname(file), srcAppPath).replace(/\\/g, '/');
        const importPath = relativePathToApp === '' ? './components/GlobalFooter' : `${relativePathToApp}/components/GlobalFooter`;
        
        const importStatement = `import GlobalFooter from "${importPath}";\n`;
        
        // Add import if not present
        if (!content.includes('GlobalFooter')) {
            // Add after the last import
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf('\\n', lastImportIndex);
                // We'll just replace the first import by prepending to it
                content = content.replace(/import /, `${importStatement}import `);
            } else {
                content = importStatement + content;
            }
        }

        // Regex to match footer
        const footerRegex = /<footer[\s\S]*?<\/footer>/g;
        content = content.replace(footerRegex, '<GlobalFooter />');
        
        // Specific cleanup for page.js which had the chat widget
        if (file.endsWith('src\\app\\page.js') || file.endsWith('src/app/page.js')) {
            const chatWidgetRegex = /{\/\* 12\. Interactive Chat Widget[\s\S]*?<\/div>\s*<\/div>/g;
            content = content.replace(chatWidgetRegex, '');
            // Also need to remove the chat state variables in page.js to prevent "chatOpen is not defined" errors
            content = content.replace(/const \[chatOpen, setChatOpen\][\s\S]*?const messagesEndRef = useRef\(null\);/g, '');
            content = content.replace(/const scrollToBottom = \(\) => {[\s\S]*?}, \[chatHistory, chatOpen\]\);/g, '');
            content = content.replace(/const handleSendChat = \(e\) => {[\s\S]*?}, 1000\);\n  };/g, '');
            content = content.replace(/const handleSuggestionClick = \(text\) => {[\s\S]*?}, 1000\);\n  };/g, '');
            content = content.replace(/<div className="chat-widget-container">[\s\S]*?<\/div>\s*<\/div>/g, '');
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
