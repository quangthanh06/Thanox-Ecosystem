const fs = require('fs');
let content = fs.readFileSync('src/components/ProductsView.tsx', 'utf8');

content = content.replace("import { Trash2, Edit, Plus, Search, Filter, Eye, Star, Upload, X, Shield, ShieldAlert, CheckCircle2, FileText, Image as ImageIcon } from 'lucide-react';", "import { Trash2, Edit, Plus, Search, Filter, Eye, Star, Upload, X, Shield, ShieldAlert, CheckCircle2, FileText, Image as ImageIcon } from 'lucide-react';\nimport { uploadMediaToSupabase } from '../lib/supabase';");

// Attached file upload
const oldFile = /const reader = new FileReader\(\);[\s\S]*?reader\.readAsDataURL\(file\);/;
content = content.replace(oldFile, `
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
      } catch (e) {
        showToast('L?i khi t?i t?p lên Cloud', 'error');
      } finally {
        setIsUploading(false);
      }`);

// Image upload
const oldImage = /reader\.onload = \(event\) => \{[\s\S]*?reader\.readAsDataURL\(file\);/;
content = content.replace(oldImage, `
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
        } catch (e) {
          showToast('L?i khi t?i ?nh lên Cloud', 'error');
        }
`);

// Add async to handlers
content = content.replace(/const handleFileUpload = \(event: React\.ChangeEvent<HTMLInputElement>\) => \{/g, "const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {");
content = content.replace(/const handleImageFilesUpload = \(files: FileList \| null\) => \{/g, "const handleImageFilesUpload = async (files: FileList | null) => {");

// Add isUploading state
content = content.replace("const [formData, setFormData] = useState<Partial<Product>>({", "const [isUploading, setIsUploading] = useState(false);\n  const [formData, setFormData] = useState<Partial<Product>>({");

fs.writeFileSync('src/components/ProductsView.tsx', content);
