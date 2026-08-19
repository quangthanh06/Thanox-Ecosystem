import React from 'react';
import { useStore } from '../../context/StoreContext';
import { getThemeTypography } from '../../utils/themeStyles';
import { Wrench, PhoneCall, Send, ShieldAlert, Sparkles, ExternalLink, Lock } from 'lucide-react';
import { Button } from '../ui/Button';

export const StorefrontMaintenanceScreen: React.FC = () => {
  const { settings, navigateToStorefront, navigateToAdmin } = useStore();
  const themeTypo = getThemeTypography(settings);

  const adminZalo = settings.adminZalo || settings.zaloHotline || '0916396901';
  const adminHotline = settings.adminHotline || settings.zaloHotline || '0916396901';
  const adminTelegram = settings.adminTelegram || settings.telegramAdminId || 'quangthank';
  const maintenanceMessage =
    settings.maintenanceMessage ||
    'Hệ thống đang được bảo trì định kỳ & nâng cấp máy chủ để phục vụ quý khách tốt nhất. Mọi nhu cầu mua sản phẩm hoặc kích hoạt key gấp, vui lòng bấm liên hệ trực tiếp Zalo Admin!';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-[#7C3AED]/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl bg-[rgba(15,15,26,0.85)] backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.6)] text-center space-y-7">
        {/* Animated Maintenance Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
            <Wrench className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <span className="absolute -top-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-black shadow-md">
            BẢO TRÌ
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1
            style={themeTypo.fontStyle}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 tracking-tight uppercase"
          >
            Cửa Hàng Đang Bảo Trì Nâng Cấp
          </h1>
          <p className="text-xs sm:text-sm text-[#CBC7E0] leading-relaxed max-w-lg mx-auto">
            {maintenanceMessage}
          </p>
        </div>

        {/* Highlight Direct Zalo Contact Box (Requested by User) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#161626] to-[#0D0D18] border border-emerald-500/40 shadow-inner space-y-4 text-left">
          <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Mua Hàng & Kích Hoạt Key Trực Tiếp Qua Zalo Admin</span>
          </div>

          <p className="text-xs text-[#8B84A8] leading-relaxed">
            Trong thời gian hệ thống bảo trì web, bạn vẫn có thể đặt mua nick Free Fire, thuê key bản quyền, chứng chỉ iOS và nạp tiền 24/7 trực tiếp qua Zalo Admin:
          </p>

          {/* Primary Action Button: Direct Clickable Zalo Link */}
          <a
            href={`https://zalo.me/${adminZalo}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/30 transition-transform active:scale-98 text-center cursor-pointer font-display"
          >
            <PhoneCall className="w-5 h-5 text-black" />
            <span>💬 NHẮN TIN ZALO ADMIN NGAY: {adminZalo}</span>
            <ExternalLink className="w-4 h-4 text-black/70" />
          </a>

          {/* Secondary Contact Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              href={`tel:${adminHotline}`}
              className="p-3 rounded-xl bg-[#1F1F35] border border-white/5 hover:border-white/20 flex items-center justify-center gap-2 text-xs font-bold text-[#F0EDFF] transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>Hotline: {adminHotline}</span>
            </a>

            <a
              href={`https://t.me/${adminTelegram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl bg-[#1F1F35] border border-white/5 hover:border-cyan-500/30 flex items-center justify-center gap-2 text-xs font-bold text-cyan-300 transition-colors"
            >
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Telegram: @{adminTelegram.replace('@', '')}</span>
            </a>
          </div>
        </div>

        {/* Security / System Footer Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-[#6B658E]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Dữ liệu và số dư tài khoản của bạn luôn được bảo vệ an toàn 100%</span>
          </div>

          <button
            type="button"
            onClick={() => navigateToStorefront('login')}
            className="text-xs text-[#8B84A8] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Đăng nhập Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
