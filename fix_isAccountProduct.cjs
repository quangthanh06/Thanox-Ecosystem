const fs = require('fs');
const file = 'src/components/storefront/StorefrontProductDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const helper = `
const isAccountProduct = (product: Product): boolean => {
  if (!product || !product.category) return false;
  const term = product.category.toLowerCase();
  return term.includes('tài kho?n') || term.includes('account');
};

// ============================================================================
`;

content = content.replace("// ============================================================================\n", helper);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed isAccountProduct');
