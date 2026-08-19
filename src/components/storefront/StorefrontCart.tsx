import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wallet,
  AlertCircle,
} from 'lucide-react';

export const StorefrontCart: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    checkoutCart,
    currentUser,
    navigateToStorefront,
  } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank'>('wallet');

  const getItemEffectivePrice = (product: typeof cart[0]['product']) => {
    if (currentUser?.sellerStatus === 'active' && product.sellerPrice) {
      return product.sellerPrice;
    }
    return product.price;
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + getItemEffectivePrice(item.product) * item.quantity,
    0
  );
  const isBalanceSufficient = currentUser.balance >= totalAmount;

  const handleCheckout = () => {
    if (paymentMethod === 'wallet' && !isBalanceSufficient) {
      navigateToStorefront('account-wallet-deposit');
      return;
    }
    const success = checkoutCart(paymentMethod);
    if (success) {
      navigateToStorefront('account-orders');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#9D5CF6] mx-auto">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="font-display text-2xl font-bold text-[#F0EDFF]">Giỏ Hàng Của Bạn Đang Trống</h2>
        <p className="text-xs text-[#8B84A8] max-w-md mx-auto">
          Hãy khám phá danh mục sản phẩm của Thanox để chọn file, menu và công cụ tối ưu hóa phù hợp nhất.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigateToStorefront('products')}>
          Khám Phá Sản Phẩm Ngay
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Breadcrumb & Header */}
      <div className="border-b border-white/5 pb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8B84A8] mb-1">
            <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
              Trang Chủ
            </button>
            <span>/</span>
            <span className="text-[#9D5CF6] font-medium">Giỏ Hàng</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#F0EDFF]">
            Giỏ Hàng ({cart.length} sản phẩm)
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa giỏ hàng</span>
        </button>
      </div>

      {/* Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart items table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const itemPrice = getItemEffectivePrice(item.product);
            const isSellerDiscount = currentUser?.sellerStatus === 'active' && !!item.product.sellerPrice;

            return (
              <div
                key={item.product.id}
                className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 sm:max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#9D5CF6]">
                      {item.product.category}
                    </span>
                    {isSellerDiscount && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                        Giá Đại Lý
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-sm text-[#F0EDFF] line-clamp-1">
                    {item.product.name}
                  </h3>
                  <div className="font-display font-extrabold text-sm text-emerald-400">
                    {itemPrice.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                {/* Quantity Stepper & Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="flex items-center bg-[#161626] border border-white/10 rounded-xl p-1">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#F0EDFF]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="font-display font-bold text-sm text-white w-24 text-right">
                    {(itemPrice * item.quantity).toLocaleString('vi-VN')}đ
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-[#8B84A8] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Checkout (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 space-y-5">
            <h3 className="font-display font-bold text-base text-[#F0EDFF] border-b border-white/5 pb-3">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#8B84A8]">
                <span>Tạm tính:</span>
                <span className="text-[#CBC7E0]">{totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-[#8B84A8]">
                <span>Phí dịch vụ tự động:</span>
                <span className="text-emerald-400 font-bold">0đ (Miễn phí)</span>
              </div>
              <div className="border-t border-white/5 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-[#F0EDFF] text-sm">Tổng cộng:</span>
                <span className="font-display font-black text-xl text-emerald-400">
                  {totalAmount.toLocaleString('vi-VN')} <span className="text-xs">đ</span>
                </span>
              </div>
            </div>

            {/* Wallet Balance check */}
            <div className="p-3 rounded-xl bg-[#161626] border border-white/5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#8B84A8]">Số dư ví hiện có:</span>
                <span className="font-bold text-emerald-400">
                  {currentUser.balance.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {!isBalanceSufficient && (
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Thiếu {(totalAmount - currentUser.balance).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            {isBalanceSufficient ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                leftIcon={<Zap className="w-4 h-4" />}
                className="w-full justify-center font-bold shadow-lg shadow-[#7C3AED]/20"
              >
                Thanh Toán Bằng Số Dư Ví
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigateToStorefront('account-wallet-deposit')}
                leftIcon={<Wallet className="w-4 h-4" />}
                className="w-full justify-center font-bold shadow-lg shadow-[#7C3AED]/20"
              >
                Nạp Thêm Tiền Vào Ví
              </Button>
            )}

            <div className="text-center text-[11px] text-[#6B658E] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Giao dịch bảo mật 100% qua Thanox Pay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
