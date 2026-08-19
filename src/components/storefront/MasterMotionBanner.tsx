import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  PhoneCall,
  Flame,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const MasterMotionBanner: React.FC = () => {
  const { navigateToStorefront } = useStore();

  const categories = [
    { name: 'File Android', sub: 'AN TOÀN - TỐI ƯU - CẬP NHẬT', slug: 'File Android' },
    { name: 'File iOS', sub: 'CHỨNG CHỈ - IPA - TỐI ƯU', slug: 'File iOS' },
    { name: 'Menu FF', sub: 'MENU VIP - AIMBOT - ANTIBAN', slug: 'Menu FF' },
    { name: 'Proxy - Tool', sub: 'PROXY - TOOL - HỖ TRỢ', slug: 'Proxy Riêng' },
    { name: 'Tài Khoản', sub: 'NICK VIP - UY TÍN - GIÁ TỐT', slug: 'Tài Khoản Game' },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#7C3AED]/40 shadow-[0_0_50px_rgba(124,58,237,0.3)] group bg-black">
      {/* Background Master Banner Image with subtle cinematic breathing animation */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[260px] sm:min-h-[380px] lg:min-h-[460px] overflow-hidden">
        <img
          src="/thanox-master-banner.jpg"
          alt="THANOX STORE Cyberpunk Master Banner"
          className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-[1.02] filter brightness-105"
        />

        {/* Ambient atmospheric purple volumetric lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-[#8B5CF6]/20 rounded-full blur-[90px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#A855F7]/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        {/* Floating Cyberpunk Light Streaks & Energy Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 left-0 w-full h-[200%] bg-[linear-gradient(45deg,transparent_40%,rgba(168,85,247,0.15)_50%,transparent_60%)] animate-sweep" />
        </div>

        {/* Interactive Clickable Hotspots for the 5 Categories */}
        <div className="absolute bottom-10 sm:bottom-14 left-0 right-0 px-4 sm:px-8 z-20">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 max-w-6xl mx-auto">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigateToStorefront('products')}
                className="group/card relative rounded-xl sm:rounded-2xl p-1.5 sm:p-3 bg-black/40 hover:bg-[#7C3AED]/30 border border-purple-500/20 hover:border-purple-400 backdrop-blur-sm transition-all transform hover:-translate-y-1 active:scale-95 cursor-pointer text-center"
              >
                <div className="hidden sm:block text-[9.5px] uppercase tracking-wider text-purple-300/80 font-bold truncate">
                  {cat.sub}
                </div>
                <div className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider truncate mt-0.5 group-hover/card:text-cyan-300 transition-colors">
                  {cat.name}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-extrabold text-purple-200 group-hover/card:text-white px-2 py-0.5 rounded-full bg-purple-600/40 border border-purple-400/30">
                  <span>XEM NGAY</span>
                  <ArrowRight className="w-2.5 h-2.5 hidden sm:inline" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Contact Bar with ZALO: 0916396901 */}
        <div className="absolute bottom-0 inset-x-0 bg-black/90 backdrop-blur-md border-t border-purple-500/30 px-4 py-2 sm:py-2.5 z-20 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2 sm:gap-3 text-purple-300 font-bold">
            <span className="hidden md:inline text-purple-400">THANOX STORE — ĐỐI TÁC TIN CẬY CỦA GAME THỦ</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <a
              href="https://zalo.me/0916396901"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-blue-500/20"
            >
              <PhoneCall className="w-3 h-3 text-blue-400" />
              <span>ZALO: 0916396901</span>
            </a>

            <a
              href="https://t.me/quangthank"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-purple-300 hover:text-white transition-colors"
            >
              <span>TELEGRAM: @quangthank</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
