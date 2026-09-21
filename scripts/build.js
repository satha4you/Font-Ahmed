#!/usr/bin/env node
// Inlines css/style.css + js/*.js into a single self-contained dist/index.html
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${read('css/style.css')}</style>`);
const core = read('js/font-core.js').replace("if (typeof module !== 'undefined') module.exports = FontCore;", '');
html = html.replace('<script src="js/font-core.js"></script>', () => `<script>\n${core}\n</script>`);
html = html.replace('<script src="js/app.js"></script>', () => `<script>\n${read('js/app.js')}\n</script>`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log('dist/index.html', (html.length / 1024).toFixed(1) + ' KB');
