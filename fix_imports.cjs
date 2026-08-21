const fs = require('fs');

// 1. Fix ProductsView.tsx
let prod = fs.readFileSync('src/components/ProductsView.tsx', 'utf8');
if (!prod.includes("import { uploadMediaToSupabase }")) {
  prod = "import { uploadMediaToSupabase } from '../lib/supabase';\n" + prod;
  fs.writeFileSync('src/components/ProductsView.tsx', prod, 'utf8');
  console.log('Fixed ProductsView.tsx import');
}

// 2. Fix CategoriesView.tsx
let cat = fs.readFileSync('src/components/CategoriesView.tsx', 'utf8');
if (!cat.includes("import { uploadMediaToSupabase }")) {
  cat = "import { uploadMediaToSupabase } from '../lib/supabase';\n" + cat;
  fs.writeFileSync('src/components/CategoriesView.tsx', cat, 'utf8');
  console.log('Fixed CategoriesView.tsx import');
}
