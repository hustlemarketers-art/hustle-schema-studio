// No dependencies. Generates a portable HTML app from the source files in dist/.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
let html = fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const css = fs.readFileSync(path.join(root,'dist/styles.css'),'utf8');
html = html.replace('<link rel="stylesheet" href="styles.css">',() => '<style>\n'+css+'\n</style>');
for (const filename of ['schema-engine.js','page-checker.js','audit-runner.js','app.js']) {
  const source = fs.readFileSync(path.join(root,'dist',filename),'utf8').replace(/<\/script/gi,'<\\/script');
  html = html.replace('<script src="'+filename+'"></script>',() => '<script>\n'+source+'\n</script>');
}
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built index.html (portable single-file app)');
