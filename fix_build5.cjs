const fs = require('fs');

let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
content = content.replace(/onChange=\{\(e\) => \{\s*const file = e\.target\.files\?\.\[0\];/g, "onChange={async (e) => {\nconst file = e.target.files?.[0];");
fs.writeFileSync('src/components/SettingsView.tsx', content, 'utf8');
console.log('Fixed SettingsView hero banner');
