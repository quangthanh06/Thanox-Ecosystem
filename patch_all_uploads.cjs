const fs = require('fs');

// Patch ProductsView.tsx
let productsContent = fs.readFileSync('src/components/ProductsView.tsx', 'utf8');

// Replace handleImageFilesUpload in ProductsView
productsContent = productsContent.replace(
  /const handleImageFilesUpload = async \(files: FileList \| null\) => \{[\s\S]*?const removeImage =/m,
  `const handleImageFilesUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      Array.from(files).forEach(async (file) => {
        if (!file.type.startsWith('image/')) {
          showToast('Vui lòng ch?n file hình ?nh (PNG, JPG, WEBP)', 'error');
          return;
        }
        try {
          const url = await uploadMediaToSupabase(file, 'products');
          setFormData((prev) => {
            const currentImages = prev.images || [];
            const newImages = [...currentImages, url];
            return {
              ...prev,
              images: newImages,
              image: prev.image || url,
            };
          });
          showToast('Ðã t?i ?nh lên Cloud thành công!', 'success');
        } catch (e: any) {
          showToast(e?.message ? \`L?i: \${e.message}\` : 'L?i khi t?i ?nh lên Cloud', 'error');
        }
      });
    };

    const removeImage =`
);

// Replace handleAttachedFileUpload
productsContent = productsContent.replace(
  /const handleAttachedFileUpload = async \(file: File \| null\) => \{[\s\S]*?const removeAttachedFile =/m,
  `const handleAttachedFileUpload = async (file: File | null) => {
      if (!file) return;
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        showToast('T?p dính kèm vu?t quá gi?i h?n 10MB', 'error');
        return;
      }

      const sizeInMB = file.size / (1024 * 1024);
      const formattedSize = sizeInMB < 1 ? \`\${Math.round(file.size / 1024)} KB\` : \`\${sizeInMB.toFixed(1)} MB\`;

      setIsUploading(true);
      try {
        const url = await uploadMediaToSupabase(file, 'digital_files');
        setFormData((prev) => ({
          ...prev,
          attachedFileName: file.name,
          attachedFileSize: formattedSize,
          attachedFileData: url,
        }));
        showToast(\`Ðã dính kèm t?p "\${file.name}" (\${formattedSize}) lên Cloud thành công!\`, 'success');
      } catch (e: any) {
        showToast(e?.message ? \`L?i: \${e.message}\` : 'L?i khi t?i t?p lên Cloud', 'error');
      } finally {
        setIsUploading(false);
      }
    };

    const removeAttachedFile =`
);

fs.writeFileSync('src/components/ProductsView.tsx', productsContent, 'utf8');

// Patch CategoriesView.tsx
let catContent = fs.readFileSync('src/components/CategoriesView.tsx', 'utf8');
catContent = catContent.replace(
  /const handleImageUpload = async \(file: File \| null\) => \{[\s\S]*?const handleSave =/m,
  `const handleImageUpload = async (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng ch?n file hình ?nh (PNG, JPG, WEBP)', 'error');
        return;
      }

      setIsUploading(true);
      try {
        const url = await uploadMediaToSupabase(file, 'categories');
        setFormData((prev) => ({
          ...prev,
          image: url,
        }));
        showToast('T?i ?nh d?i di?n danh m?c lên Cloud thành công!', 'success');
      } catch (e: any) {
        showToast(e?.message ? \`L?i: \${e.message}\` : 'L?i khi t?i ?nh lên Cloud', 'error');
      } finally {
        setIsUploading(false);
      }
    };

    const handleSave =`
);
fs.writeFileSync('src/components/CategoriesView.tsx', catContent, 'utf8');

// Patch SettingsView.tsx
let setContent = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
setContent = setContent.replace(
  /const handleAudioUpload = async \(file: File \| null\) => \{[\s\S]*?\/\/ VietQR Admin Preview states/m,
  `const handleAudioUpload = async (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith('audio/')) {
        showToast('Vui lòng ch?n file âm thanh (MP3, WAV, OGG)', 'error');
        return;
      }
      setIsUploadingAudio(true);
      try {
        const url = await uploadMediaToSupabase(file, 'audio');
        setNewTrackUrl(url);
        setPreviewAudioUrl(url);
        setIsUploadingAudio(false);
        showToast(\`Ðã t?i file "\${file.name}" lên Cloud thành công! B?m nghe th? ho?c Thêm vào danh sách.\`, 'success');
      } catch (e: any) {
        setIsUploadingAudio(false);
        showToast(e?.message ? \`L?i: \${e.message}\` : 'L?i khi t?i âm thanh lên Cloud', 'error');
      }
    };

    // VietQR Admin Preview states`
);
fs.writeFileSync('src/components/SettingsView.tsx', setContent, 'utf8');

console.log('Successfully patched all upload handlers!');
