import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Flame, ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A12] text-[#F0EDFF] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/30 flex items-center justify-center mb-6 shadow-xl shadow-[#7C3AED]/10">
        <ShieldAlert className="w-8 h-8 text-[#9D5CF6]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#8B84A8] mb-4">
        <span>ERROR 404</span>
        <span>•</span>
        <span>PAGE NOT FOUND</span>
      </div>

      <h1 className="font-display text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
        Trang Không Tồn Tại
      </h1>

      <p className="text-sm text-[#8B84A8] max-w-md mb-8 leading-relaxed">
        Đường dẫn bạn đang truy cập không tồn tại hoặc đã được chuyển sang địa chỉ mới trên hệ thống Thanox.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/')}
          leftIcon={<Home className="w-4 h-4" />}
        >
          Về Cửa Hàng (Storefront)
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/qtri')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Trang Quản Trị (/qtri)
        </Button>
      </div>

      <div className="mt-12 text-xs text-[#6B658E] flex items-center gap-2">
        <Flame className="w-4 h-4 text-[#9D5CF6]" />
        <span>Thanox Ecosystem — Hệ Thống Bán Hàng & Quản Trị Tự Động</span>
      </div>
    </div>
  );
};
