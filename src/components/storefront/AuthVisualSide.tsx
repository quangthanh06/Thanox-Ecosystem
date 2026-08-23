import React from 'react';
import {
  ShieldCheck,
  Zap,
  Flame,
  Award,
  Lock,
  Headphones,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AuthVisualSide: React.FC = () => {
  return (
    <div className="relative hidden lg:flex flex-col justify-between p-8 xl:p-10 rounded-3xl bg-gradient-to-br from-[#120D26] via-[#0D0D18] to-[#0A0A12] border border-[#7C3AED]/25 overflow-hidden shadow-2xl">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand & Badge */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-0.5 shadow-lg shadow-[#7C3AED]/30">
            <div className="w-full h-full bg-[#0A0A14] rounded-[14px] flex items-center justify-center text-[#9D5CF6]">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="font-display text-xl font-black text-white tracking-wider flex items-center gap-1.5">
              <span>THANOX</span>
              <span className="text-[#9D5CF6] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#7C3AED]/20 border border-[#7C3AED]/40">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-[#8B84A8]">
              Gaming Tools & License Platform
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs font-semibold text-[#C084FC]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Hệ thống giao License tự động 24/7</span>
        </div>
      </div>

      {/* Middle Value Propositions */}
      <div className="relative z-10 my-8 space-y-4">
        <h2 className="font-display text-2xl xl:text-3xl font-extrabold text-[#F0EDFF] leading-snug">
          Trải nghiệm tối ưu Free Fire & Gaming đỉnh cao cùng Thanox
        </h2>
        <p className="text-xs xl:text-sm text-[#8B84A8] leading-relaxed">
          Đăng nhập ngay để quản lý đơn hàng, nạp ví tự động qua VietQR và kích hoạt license file game trong 3 giây.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#9D5CF6] flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F0EDFF]">Giao Key Tức Thì Sau 3 Giây</div>
              <div className="text-[11px] text-[#8B84A8]">Hệ thống auto-delivery 24/7 không cần chờ Admin duyệt thủ công.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4] flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F0EDFF]">Bảo Mật 2 Lớp & 100% Antiban</div>
              <div className="text-[11px] text-[#8B84A8]">Dữ liệu mã hóa SSL/TLS, bảo vệ thông tin tài khoản người dùng tuyệt đối.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
              <Headphones className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F0EDFF]">Hỗ Trợ Kỹ Thuật Zalo 24/7</div>
              <div className="text-[11px] text-[#8B84A8]">Đội ngũ hỗ trợ cài đặt, fix lỗi và hướng dẫn sử dụng nhiệt tình qua Hotline 0889696810.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust & Stats Footer */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#8B84A8]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Hơn 12.000+ game thủ tin dùng</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#9D5CF6]">
          <Lock className="w-3.5 h-3.5" />
          <span>256-Bit Encrypted</span>
        </div>
      </div>
    </div>
  );
};
