import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { ProductImage } from '../ui/SafeImage';
import {
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const StorefrontCart: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getItemEffectivePrice,
    currentUser,
    navigateToStorefront,
    createOrder,
    setSelectedOrderId,
    showToast,
  } = useStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const totalAmount = cart.reduce((sum, item) => {
    const effectivePrice = getItemEffectivePrice(item.product, currentUser, item.selectedPackage);
    return sum + effectivePrice * item.quantity;
  }, 0);

  const isBalanceSufficient = (currentUser?.balance ?? 0) >= totalAmount;

  const handleCheckout = async () => {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập để thanh toán đơn hàng', 'error');
      navigateToStorefront('login');
      return;
    }

    if (cart.length === 0) return;

    if (!isBalanceSufficient) {
      showToast('Số dư ví không đủ, vui lòng nạp thêm tiền', 'error');
      navigateToStorefront('account-wallet-deposit');
      return;
    }

    setIsCheckingOut(true);

    try {
      let firstOrderId: string | null = null;

      for (const item of cart) {
        const res = await createOrder(
          item.product.id,
          item.quantity,
          'wallet',
          item.selectedPackage
        );
        if (res?.success && res.order && !firstOrderId) {
          firstOrderId = res.order.id;
        }
      }

      clearCart();
      showToast('🎉 Thanh toán thành công! Mã bản quyền đã sẵn sàng trong đơn hàng', 'success');

      if (firstOrderId) {
        setSelectedOrderId(firstOrderId);
      }
      navigateToStorefront('account-orders');
    } catch (err: any) {
      showToast(err.message || 'Lỗi thanh toán giỏ hàng', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl glass-standard text-[#C084FC] flex items-center justify-center mx-auto shadow-lg shadow-[#7C3AED]/15 border border-white/12">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-xl text-[#F4F2FF]">Giỏ Hàng Của Bạn Đang Trống</h2>
        <p className="text-xs text-[#938EB5] leading-relaxed">
          Hãy khám phá danh mục sản phẩm và chọn các gói file hoặc key bản quyền phù hợp với bạn.
        </p>
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={() => navigateToStorefront('products')}>
            Xem Danh Mục Sản Phẩm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Header & Back */}
      <div className="flex items-center justify-between border-b border-white/6 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToStorefront('products')}
            className="p-2 rounded-xl glass-subtle hover:bg-white/10 text-[#938EB5] hover:text-white transition-all cursor-pointer active:scale-90"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-[#F4F2FF] tracking-tight uppercase">
              Giỏ Hàng ({cart.length} sản phẩm)
            </h1>
            <p className="text-xs text-[#938EB5]">Kiểm tra thông tin các gói trước khi thanh toán tự động</p>
          </div>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-[#938EB5] hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xóa toàn bộ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {cart.map((item) => {
            const itemPrice = getItemEffectivePrice(item.product, currentUser, item.selectedPackage);
            const isSellerDiscount = currentUser?.sellerStatus === 'active' && !!item.product.sellerPrice;

            const cartItemKey = `${item.product.id}-${item.selectedPackage?.id || 'base'}`;
            return (
              <div
                key={cartItemKey}
                className="glass-standard rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/8 shadow-md"
              >
                <div className="flex items-center gap-3.5 sm:max-w-md">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-sm bg-[#121124]">
                    <ProductImage product={item.product} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#C084FC]">
                        {item.product.category}
                      </span>
                      {item.selectedPackage?.name && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/25">
                          {item.selectedPackage.name}
                        </span>
                      )}
                      {isSellerDiscount && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/25">
                          Giá Đại Lý
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#F4F2FF] line-clamp-1">
                      {item.product.name}
                    </h3>
                    <div className="font-display font-black text-sm text-emerald-300">
                      {itemPrice.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper & Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="flex items-center glass-subtle border border-white/8 rounded-2xl p-1">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedPackage?.id)}
                      className="w-7 h-7 rounded-xl hover:bg-white/10 flex items-center justify-center text-white text-xs font-bold cursor-pointer active:scale-90 transition-all"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#F4F2FF]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedPackage?.id)}
                      className="w-7 h-7 rounded-xl hover:bg-white/10 flex items-center justify-center text-white text-xs font-bold cursor-pointer active:scale-90 transition-all"
                    >
                      +
                    </button>
                  </div>

                  <div className="font-display font-black text-sm text-white w-24 text-right">
                    {(itemPrice * item.quantity).toLocaleString('vi-VN')}đ
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedPackage?.id)}
                    className="p-2 text-[#938EB5] hover:text-red-400 transition-all cursor-pointer active:scale-90"
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
          <div className="glass-prominent rounded-3xl p-5 sm:p-6 space-y-5 border border-white/12 shadow-xl">
            <h3 className="font-display font-black text-base text-[#F4F2FF] border-b border-white/8 pb-3">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#938EB5]">
                <span>Tạm tính:</span>
                <span className="text-[#F4F2FF] font-semibold">{totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-[#938EB5]">
                <span>Phí dịch vụ tự động:</span>
                <span className="text-emerald-300 font-bold">0đ (Miễn phí)</span>
              </div>
              <div className="border-t border-white/8 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-[#F4F2FF] text-sm">Tổng cộng:</span>
                <span className="font-display font-black text-xl text-emerald-300">
                  {totalAmount.toLocaleString('vi-VN')} <span className="text-xs">đ</span>
                </span>
              </div>
            </div>

            {/* Wallet Balance check */}
            <div className="p-3.5 rounded-2xl glass-subtle border border-white/8 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#938EB5]">Số dư ví hiện có:</span>
                <span className="font-bold text-emerald-300">
                  {(currentUser?.balance ?? 0).toLocaleString('vi-VN')}đ
                </span>
              </div>

              {!isBalanceSufficient && (
                <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Thiếu {(totalAmount - (currentUser?.balance ?? 0)).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            {isBalanceSufficient ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                isLoading={isCheckingOut}
                leftIcon={<Zap className="w-4 h-4" />}
                className="w-full justify-center font-black shadow-lg shadow-[#7C3AED]/25 uppercase tracking-wide"
              >
                Thanh Toán Bằng Số Dư Ví
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigateToStorefront('account-wallet-deposit')}
                leftIcon={<Zap className="w-4 h-4 text-amber-300" />}
                className="w-full justify-center font-bold"
              >
                Nạp Thêm Tiền Vào Ví
              </Button>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#5C567A]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Giao key & quyền kích hoạt ngay lập tức</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
