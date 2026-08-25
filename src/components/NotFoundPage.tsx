import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Flame, ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07070D] text-[#F4F2FF] flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7C3AED]/12 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 glass-prominent border border-white/12 rounded-3xl p-8 sm:p-12 max-w-lg mx-auto space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/35 flex items-center justify-center mx-auto shadow-xl shadow-[#7C3AED]/15">
          <ShieldAlert className="w-8 h-8 text-[#C084FC]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle border border-white/10 text-xs font-mono text-[#938EB5]">
          <span>ERROR 404</span>
          <span>•</span>
          <span>PAGE NOT FOUND</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F4F2FF] tracking-tight">
          Trang Không Tồn Tại
        </h1>

        <p className="text-xs sm:text-sm text-[#938EB5] leading-relaxed">
          Đường dẫn bạn đang truy cập không tồn tại hoặc đã được chuyển sang địa chỉ mới trên hệ thống Thanox.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Về Cửa Hàng
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/qtri')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Trang Quản Trị
          </Button>
        </div>

        <div className="pt-4 border-t border-white/8 text-[11px] text-[#5C567A] flex items-center justify-center gap-2">
          <Flame className="w-3.5 h-3.5 text-[#C084FC]" />
          <span>Thanox Ecosystem — Liquid Glass Pro</span>
        </div>
      </div>
    </div>
  );
};
