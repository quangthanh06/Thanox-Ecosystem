import { Product } from '../types';

// Nhận diện sản phẩm TÀI KHOẢN (acc/nick/gmail) dùng chung toàn hệ thống:
// - productType === 'account'
// - category/tên chứa "tài khoản", "nick", "gmail"
// - category/tên có từ "acc" đứng riêng (VD: "ACC CLONE", "Acc Free Fire")
// Lưu ý dùng \b để tránh nhận nhầm các từ như "access".
export const isAccountLikeProduct = (
  product: Pick<Product, 'productType' | 'category' | 'name'>
): boolean => {
  if (product.productType === 'account') return true;
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return (
    cat.includes('tài khoản') ||
    cat.includes('nick') ||
    cat.includes('gmail') ||
    cat.includes('acc') || // category do admin tự đặt — giữ nhận diện rộng như bản cũ
    name.includes('tài khoản') ||
    /\bacc\b/.test(name) // tên sp: chỉ nhận "acc" đứng riêng (tránh nhầm "access"...)
  );
};

export const isAccountLikeCategory = (category: string): boolean =>
  isAccountLikeProduct({ productType: undefined, category: category || '', name: '' });
