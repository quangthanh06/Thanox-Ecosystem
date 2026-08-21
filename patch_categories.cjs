const fs = require('fs');
let content = fs.readFileSync('src/components/CategoriesView.tsx', 'utf8');

content = content.replace("import { Trash2, Edit, Plus, Upload, X } from 'lucide-react';", "import { Trash2, Edit, Plus, Upload, X } from 'lucide-react';\nimport { uploadMediaToSupabase } from '../lib/supabase';");

const oldUpload = `      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          image: base64,
        }));
        showToast('T?i ?nh d?i di?n danh m?c thành công!', 'success');
      };
      reader.readAsDataURL(file);`;

const newUpload = `      setIsUploading(true);
      try {
        const url = await uploadMediaToSupabase(file, 'categories');
        setFormData((prev) => ({
          ...prev,
          image: url,
        }));
        showToast('T?i ?nh d?i di?n danh m?c lên Cloud thành công!', 'success');
      } catch (e) {
        showToast('L?i khi t?i ?nh lên Cloud', 'error');
      } finally {
        setIsUploading(false);
      }`;

// We might need to add isUploading state.
const isUploadingDecl = `  const [isUploading, setIsUploading] = useState(false);`;

content = content.replace("const [formData, setFormData] = useState<Partial<Category>>({", isUploadingDecl + "\n  const [formData, setFormData] = useState<Partial<Category>>({");
content = content.replace(/const handleImageUpload = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{/g, "const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {");

// The oldUpload regex matching since encoding might be weird
const regex = /const reader = new FileReader\(\);[\s\S]*?reader\.readAsDataURL\(file\);/;
content = content.replace(regex, newUpload);

// Fix loading indicator in the upload button
content = content.replace("<span>T?i ?nh lên (Max 5MB)</span>", "{isUploading ? <span>Ðang t?i lên Cloud...</span> : <span>T?i ?nh lên (Max 5MB)</span>}");
content = content.replace("disabled={!formData.name.trim()}", "disabled={!formData.name.trim() || isUploading}");

fs.writeFileSync('src/components/CategoriesView.tsx', content);
