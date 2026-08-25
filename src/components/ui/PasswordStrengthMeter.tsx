import React from 'react';
import { Check, X, ShieldCheck, ShieldAlert, Sparkles, Lock } from 'lucide-react';

export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export interface StrengthRule {
  id: string;
  label: string;
  isValid: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  className = '',
}) => {
  if (!password) return null;

  // 4 Core Security Rules
  const rules: StrengthRule[] = [
    {
      id: 'length',
      label: 'Tối thiểu 8 ký tự',
      isValid: password.length >= 8,
    },
    {
      id: 'case',
      label: 'Chữ hoa & thường (Aa)',
      isValid: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'Bao gồm số (0-9)',
      isValid: /[0-9]/.test(password),
    },
    {
      id: 'symbol',
      label: 'Ký tự đặc biệt (!@#$)',
      isValid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const validCount = rules.filter((r) => r.isValid).length;
  const percentage = Math.min(100, Math.round((validCount / rules.length) * 100));

  // Determine Level, Colors, Glowing Effects and Mascot Feedback
  const getLevelConfig = () => {
    if (validCount <= 1) {
      return {
        level: 'weak',
        title: 'Mật khẩu yếu',
        subtitle: 'Dễ bị bẻ khóa',
        barGradient: 'from-rose-500 via-red-500 to-rose-600',
        glowShadow: 'shadow-[0_0_15px_rgba(244,63,94,0.6)]',
        badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        dotColor: 'bg-rose-500 shadow-[0_0_8px_#F43F5E]',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      };
    }
    if (validCount === 2) {
      return {
        level: 'fair',
        title: 'Mức trung bình',
        subtitle: 'Nên thêm số hoặc ký tự',
        barGradient: 'from-amber-400 via-orange-500 to-amber-500',
        glowShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]',
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        dotColor: 'bg-amber-400 shadow-[0_0_8px_#FBBF24]',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
      };
    }
    if (validCount === 3) {
      return {
        level: 'good',
        title: 'Bảo mật tốt',
        subtitle: 'An toàn cho tài khoản',
        barGradient: 'from-emerald-400 via-teal-400 to-cyan-400',
        glowShadow: 'shadow-[0_0_18px_rgba(16,185,129,0.6)]',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        dotColor: 'bg-emerald-400 shadow-[0_0_8px_#34D399]',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      };
    }
    return {
      level: 'strong',
      title: 'Tuyệt đối an toàn ✨',
      subtitle: 'Chuẩn mã hóa 256-bit',
      barGradient: 'from-[#7C3AED] via-[#06B6D4] to-[#10B981]',
      glowShadow: 'shadow-[0_0_22px_rgba(6,182,212,0.8)]',
      badgeBg: 'bg-gradient-to-r from-[#7C3AED]/20 to-[#06B6D4]/20 border-cyan-500/40 text-cyan-300',
      dotColor: 'bg-cyan-400 shadow-[0_0_10px_#22D3EE]',
      icon: <Sparkles className="w-3.5 h-3.5 text-cyan-300" />,
    };
  };

  const config = getLevelConfig();

  return (
    <div
      className={`p-3.5 rounded-2xl bg-[#121222]/80 backdrop-blur-md border border-white/10 shadow-lg space-y-2.5 transition-all duration-300 ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="w-3 h-3 text-[#938EB5]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#F4F2FF] flex items-center gap-1.5">
              <span>Độ mạnh:</span>
              <span className="font-extrabold">{config.title}</span>
            </div>
            <div className="text-[9.5px] text-[#938EB5]">{config.subtitle}</div>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div
          className={`px-2.5 py-1 rounded-xl border text-[10.5px] font-bold flex items-center gap-1.5 transition-all ${config.badgeBg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
          <span>{percentage}%</span>
          {config.icon}
        </div>
      </div>

      {/* Modern 4-Segment Animated Liquid Energy Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-2 bg-black/40 p-0.5 rounded-full border border-white/5 overflow-hidden">
        {[1, 2, 3, 4].map((step) => {
          const isFilled = validCount >= step;
          return (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                isFilled
                  ? `bg-gradient-to-r ${config.barGradient} ${config.glowShadow}`
                  : 'bg-white/5'
              }`}
            >
              {isFilled && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.8s_infinite] pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time Interactive Requirements Badges */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`px-2 py-1 rounded-xl border text-[10px] font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              rule.isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'bg-white/[0.02] border-white/5 text-[#6B658E]'
            }`}
          >
            {rule.isValid ? (
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-white/5 text-[#5C567A] flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            )}
            <span className="truncate">{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
