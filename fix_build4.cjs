const fs = require('fs');

let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
content = content.replace('const handleAudioFileUpload = (file: File | null) => {', 'const handleAudioFileUpload = async (file: File | null) => {');
fs.writeFileSync('src/components/SettingsView.tsx', content, 'utf8');
console.log('Fixed SettingsView');
