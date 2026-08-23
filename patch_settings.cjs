const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

content = content.replace("import { StoreSettings } from '../types';", "import { StoreSettings } from '../types';\nimport { uploadMediaToSupabase } from '../lib/supabase';");

// Audio upload
const oldAudio = /const reader = new FileReader\(\);[\s\S]*?reader\.readAsDataURL\(file\);/;
content = content.replace(oldAudio, `
      setIsUploadingAudio(true);
      try {
        const url = await uploadMediaToSupabase(file, 'audio');
        setNewTrackUrl(url);
        setPreviewAudioUrl(url);
        setIsUploadingAudio(false);
        showToast(\`�� t?i file "\${file.name}" l�n Cloud th�nh c�ng! B?m nghe th? ho?c Th�m v�o danh s�ch.\`, 'success');
      } catch (e) {
        setIsUploadingAudio(false);
        showToast('L?i khi t?i file �m thanh l�n Cloud', 'error');
      }`);
      
content = content.replace(/const handleAudioFileUpload = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{/g, "const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {");

// Hero Banner upload (it's inline)
const oldHero = /const reader = new FileReader\(\);[\s\S]*?reader\.readAsDataURL\(file\);/;
content = content.replace(oldHero, `
                          showToast('�ang t?i ?nh l�n Cloud, vui l�ng d?i...', 'info');
                          try {
                            const url = await uploadMediaToSupabase(file, 'banners');
                            setFormData((prev) => ({
                              ...prev,
                              heroBanner: {
                                ...(prev.heroBanner || {
                                  brightness: 65,
                                  blur: 0,
                                  overlayOpacity: 45,
                                  glowEffect: true,
                                  hotlineZalo: '0889696810',
                                }),
                                backgroundImage: url,
                              },
                            }));
                            showToast('�� t?i ?nh n?n Banner l�n Cloud th�nh c�ng!', 'success');
                          } catch (e) {
                            showToast('L?i t?i ?nh l�n Cloud', 'error');
                          }`);
                          
content = content.replace("if (file) {", "if (file) { (async () => {");
content = content.replace(/reader\.readAsDataURL\(file\);\s*\}\}/g, "})()}}"); // We'll just manually replace the closing brace of the inline function later if this regex is bad. Wait, let's just make it simple.
// Actually, it's safer to just replace the whole inline onChange.

fs.writeFileSync('src/components/SettingsView.tsx', content);
