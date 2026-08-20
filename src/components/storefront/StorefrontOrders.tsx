import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Package,
  Key,
  Copy,
  Check,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';

export const StorefrontOrders: React.FC = () => {
  const { orders, products, currentUser, navigateToStorefront, showToast } = useStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const userOrders = (orders || []).filter((o) => o && o.userId === currentUser?.id);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast('Đã sao chép License Key vào bộ nhớ tạm', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Breadcrumb & Header */}
      <div className="border-b border-white/5 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8B84A8] mb-1.5">
            <button onClick={() => navigateToStorefront('home')} className="hover:text-white transition-colors cursor-pointer">
              Trang Chủ
            </button>
            <span>/</span>
            <button onClick={() => navigateToStorefront('account')} className="hover:text-white transition-colors cursor-pointer">
              Tài Khoản
            </button>
            <span>/</span>
            <span className="text-[#9D5CF6] font-medium">Đơn Hàng & License Key</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#F0EDFF]">
            Lịch Sử Mua Hàng & Key Kích Hoạt
          </h1>
          <p className="text-xs text-[#8B84A8] mt-0.5">
            Quản lý tất cả mã kích hoạt License Key và link tải file của bạn
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigateToStorefront('products')}
          leftIcon={<ShoppingBag className="w-4 h-4" />}
        >
          Mua Thêm Sản Phẩm
        </Button>
      </div>

      {/* Orders List */}
      {userOrders.length === 0 ? (
        <div className="text-center py-16 bg-[#0F0F1A] border border-dashed border-white/10 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center text-[#9D5CF6] mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#F0EDFF]">
            Bạn Chưa Có Đơn Hàng Nào
          </h2>
          <p className="text-xs text-[#8B84A8] max-w-sm mx-auto">
            Hãy lựa chọn các gói bản quyền Thanox và thanh toán tự động để nhận key ngay lập tức.
          </p>
          <Button variant="primary" onClick={() => navigateToStorefront('products')}>
            Xem Sản Phẩm Ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => (
            <div
              key={order.id}
              className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-[#9D5CF6]">
                    #{order.id}
                  </span>
                  <span className="text-xs text-[#8B84A8]">
                    Ngày mua: <span className="text-[#CBC7E0]">{order.createdAt}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      order.status === 'completed'
                        ? 'success'
                        : order.status === 'processing'
                        ? 'warning'
                        : 'danger'
                    }
                    size="xs"
                  >
                    {order.status === 'completed'
                      ? 'Hoàn thành — Đã giao key'
                      : order.status === 'processing'
                      ? 'Đang xử lý'
                      : 'Đã hủy'}
                  </Badge>
                </div>
              </div>

              {/* Order Item Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8B84A8]">
                    {order.productCategory || order.category}
                  </span>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#F0EDFF]">
                    {order.productName}
                  </h3>
                  <div className="text-xs text-[#8B84A8]">
                    Số lượng: <strong className="text-[#CBC7E0]">{order.quantity}</strong> • Thanh toán:{' '}
                    <strong className="text-emerald-400">
                      {(order.totalAmount || order.totalPrice || 0).toLocaleString('vi-VN')}đ
                    </strong>
                  </div>
                </div>
              </div>

              {/* Order Delivery Content (Download Link & License Key / Account Credentials) */}
              {(() => {
                const prod = products.find((p) => p.id === order.productId);
                const rawContent = order.deliveredContent || order.key || prod?.downloadLinkOrKeys || '';
                
                const isAcc =
                  (order.category || prod?.category || '').toLowerCase().includes('tài khoản') ||
                  (order.category || prod?.category || '').toLowerCase().includes('acc') ||
                  (order.category || prod?.category || '').toLowerCase().includes('nick') ||
                  prod?.productType === 'account' ||
                  rawContent.includes('TÀI KHOẢN:') ||
                  rawContent.includes('Tài khoản:') ||
                  rawContent.includes('|');

                // If Account, parse username, password, 2FA
                let accUser = '';
                let accPass = '';
                let acc2FA = '';

                if (isAcc) {
                  if (rawContent.includes('|')) {
                    const firstLine = rawContent.split('\n')[0].trim();
                    const parts = firstLine.split('|');
                    accUser = parts[0]?.trim() || '';
                    accPass = parts[1]?.trim() || '';
                    acc2FA = parts[2]?.trim() || '';
                  } else {
                    const uMatch = rawContent.match(/(?:Tài khoản|TÀI KHOẢN):\s*([^\n|]+)/i);
                    const pMatch = rawContent.match(/(?:Mật khẩu|MẬT KHẨU):\s*([^\n|]+)/i);
                    const fMatch = rawContent.match(/(?:2FA|Mã 2FA|Ghi chú):\s*([^\n|]+)/i);
                    if (uMatch) accUser = uMatch[1].trim();
                    if (pMatch) accPass = pMatch[1].trim();
                    if (fMatch) acc2FA = fMatch[1].trim();
                  }
                }

                // Extract URL if exists (non-account)
                const urlMatch = !isAcc ? (prod?.downloadUrl || rawContent).match(/https?:\/\/[^\s]+/) : null;
                const downloadLink = !isAcc ? (prod?.downloadUrl || (urlMatch ? urlMatch[0] : null)) : null;
                
                // Extract clean key
                const cleanKey = !isAcc ? (prod?.licenseKeys || rawContent.replace(/https?:\/\/[^\s]+/g, '').trim() || rawContent) : '';

                if (isAcc) {
                  return (
                    <div className="space-y-3 pt-2">
                      {/* Account Delivery Card */}
                      <div className="p-4 rounded-2xl bg-[#0F0F1A] border border-cyan-500/30 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase font-bold text-cyan-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-cyan-400" />
                            Thông Tin Tài Khoản & Mật Khẩu Bàn Giao
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(rawContent)}
                            className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                          >
                            {copiedKey === rawContent ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Đã sao chép tất cả!
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Copy className="w-3.5 h-3.5" /> Sao chép tất cả
                              </span>
                            )}
                          </button>
                        </div>

                        {accUser || accPass ? (
                          <div className="space-y-2">
                            {/* Username Row */}
                            {accUser && (
                              <div className="p-2.5 rounded-xl bg-[#161626] border border-white/5 flex items-center justify-between gap-2">
                                <div className="text-xs font-mono">
                                  <span className="text-[#8B84A8] text-[10.5px] block font-sans">TÀI KHOẢN / EMAIL:</span>
                                  <span className="text-cyan-300 font-bold text-sm select-all">{accUser}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(accUser)}
                                  className="text-[11px] font-bold text-[#CBC7E0] hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  {copiedKey === accUser ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === accUser ? 'Đã chép' : 'Sao chép TK'}</span>
                                </button>
                              </div>
                            )}

                            {/* Password Row */}
                            {accPass && (
                              <div className="p-2.5 rounded-xl bg-[#161626] border border-white/5 flex items-center justify-between gap-2">
                                <div className="text-xs font-mono">
                                  <span className="text-[#8B84A8] text-[10.5px] block font-sans">MẬT KHẨU:</span>
                                  <span className="text-emerald-400 font-bold text-sm select-all">{accPass}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(accPass)}
                                  className="text-[11px] font-bold text-[#CBC7E0] hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  {copiedKey === accPass ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === accPass ? 'Đã chép' : 'Sao chép MK'}</span>
                                </button>
                              </div>
                            )}

                            {/* 2FA Row */}
                            {acc2FA && (
                              <div className="p-2.5 rounded-xl bg-[#161626] border border-white/5 flex items-center justify-between gap-2">
                                <div className="text-xs font-mono">
                                  <span className="text-[#8B84A8] text-[10.5px] block font-sans">2FA / GHI CHÚ:</span>
                                  <span className="text-purple-300 font-bold text-xs select-all">{acc2FA}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(acc2FA)}
                                  className="text-[11px] font-bold text-[#CBC7E0] hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  {copiedKey === acc2FA ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === acc2FA ? 'Đã chép' : 'Sao chép 2FA'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-mono text-xs font-bold text-cyan-300 bg-[#0A0A10] p-3 rounded-xl border border-white/5 select-all whitespace-pre-wrap break-all leading-relaxed">
                            {rawContent}
                          </div>
                        )}
                      </div>

                      {/* Instructions if available */}
                      {prod?.instructions && (
                        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-[#CBC7E0] space-y-1">
                          <div className="font-bold text-[#9D5CF6]">📖 Hướng dẫn đăng nhập & đổi mật khẩu:</div>
                          <div className="whitespace-pre-wrap">{prod.instructions}</div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 pt-2">
                    {/* Direct Attached File Download (If Admin uploaded file directly) */}
                    {prod?.attachedFileName && prod?.attachedFileData && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#161626] to-[#06B6D4]/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-display font-bold text-xs text-[#F0EDFF]">
                              Tệp Đính Kèm: <span className="text-emerald-300 font-mono">{prod.attachedFileName}</span>
                            </div>
                            <div className="text-[10.5px] text-[#8B84A8]">
                              Dung lượng: {prod.attachedFileSize || 'Sẵn sàng tải xuống'} • Bàn giao trực tiếp
                            </div>
                          </div>
                        </div>

                        <a
                          href={prod.attachedFileData}
                          download={prod.attachedFileName}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 text-center shrink-0 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>📥 Tải Tệp Về Máy Ngay</span>
                        </a>
                      </div>
                    )}

                    {/* Direct Download Button */}
                    {downloadLink && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#161626] to-[#7C3AED]/20 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-display font-bold text-xs text-[#F0EDFF]">
                              File Cài Đặt Sẵn Sàng Tải Xuống
                            </div>
                            <div className="text-[10.5px] text-[#8B84A8] line-clamp-1 font-mono">
                              {downloadLink}
                            </div>
                          </div>
                        </div>

                        <a
                          href={downloadLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] hover:from-[#0891B2] hover:to-[#06B6D4] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-transform active:scale-95 text-center shrink-0 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>📥 Tải File Cài Đặt Ngay</span>
                        </a>
                      </div>
                    )}

                    {/* Delivered License Key Box */}
                    {cleanKey && (
                      <div className="p-3.5 rounded-2xl bg-[#161626] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase font-bold text-[#9D5CF6] flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" />
                            Mã Bản Quyền / License Key Kích Hoạt
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(cleanKey)}
                            className="text-xs font-bold text-[#CBC7E0] hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg"
                          >
                            {copiedKey === cleanKey ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Đã sao chép!
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Copy className="w-3.5 h-3.5" /> Sao chép Key
                              </span>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-xs font-bold text-amber-300 bg-[#0A0A10] p-3 rounded-xl border border-white/5 select-all whitespace-pre-wrap break-all leading-relaxed">
                          {cleanKey}
                        </div>
                      </div>
                    )}

                    {/* Instructions if available */}
                    {prod?.instructions && (
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-[#CBC7E0] space-y-1">
                        <div className="font-bold text-[#9D5CF6]">📖 Hướng dẫn kích hoạt & lưu ý:</div>
                        <div className="whitespace-pre-wrap">{prod.instructions}</div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
                <div className="text-[#8B84A8] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Bảo hành trọn đời theo chính sách Thanox</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => navigateToStorefront('support')}
                    leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                  >
                    Báo lỗi / Cần hỗ trợ
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
