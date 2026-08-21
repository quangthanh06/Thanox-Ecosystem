import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { AuthVisualSide } from './AuthVisualSide';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  ShieldCheck,
} from 'lucide-react';

export const StorefrontForgotPassword: React.FC = () => {
  const { requestPasswordReset, resetPassword, showToast } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setIsLoading(false);
      if (res.success) {
        setStep('reset');
        setSuccessMessage('Đã gửi liên kết đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư.');
      } else {
        setErrorMessage(res.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Lỗi hệ thống');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetCode || resetCode.trim().length < 6) {
      setErrorMessage('Vui lòng nhập mã xác thực OTP 6 số');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(email, resetCode, newPassword);
      setIsLoading(false);
      if (res.success) {
        setStep('reset');
        showToast('�?i m?t kh?u th�nh c�ng! Vui l�ng dang nh?p l?i.', 'success');
          navigate('/login');
      } else {
        setErrorMessage(res.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Lỗi hệ thống');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-3 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Visual Hero Side */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-6">
          <AuthVisualSide />
        </div>

        {/* Right Form Card Side */}
        <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center">
          <div className="bg-[#0F0F1A]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-6">
            {/* Back Navigation */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#8B84A8] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Đăng nhập</span>
              </Link>
              <span className="text-xs text-[#9D5CF6] font-mono">Bảo mật 2 lớp</span>
            </div>

            {/* Header / Icon */}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6] shadow-lg shadow-[#7C3AED]/20 mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F0EDFF] tracking-tight">
                {step === 'request' ? 'Khôi phục mật khẩu 🔑' : 'Thiết lập mật khẩu mới 🔒'}
              </h1>

              {/* 🌟 USER REQUESTED SPECIAL ANIMATED COLOR MOTION BANNER */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#7C3AED]/20 via-[#06B6D4]/15 to-[#EC4899]/20 border border-[#06B6D4]/40 shadow-lg shadow-cyan-500/10 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-300">Yêu cầu từ hệ thống</span>
                </div>
                <div className="text-sm sm:text-base font-black leading-snug thanox-color-cycle drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                  "Liên hệ ADMIN để reset mật khẩu , Nhớ kèm email của bạn nhé"
                </div>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://zalo.me/0916396901`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-md shadow-blue-500/30 transition-all hover:scale-105"
                  >
                    <span>💬 Nhắn Tin Zalo Admin Reset Mật Khẩu (0916396901)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#8B84A8] pt-1">
                {step === 'request'
                  ? 'Hoặc bạn có thể nhập email bên dưới để gửi yêu cầu đặt lại mật khẩu tự động:'
                  : 'Nhập mã xác thực vừa nhận và mật khẩu mới cho tài khoản của bạn:'}
              </p>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {step === 'request' ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CBC7E0]">
                    Địa chỉ Email đăng ký tài khoản
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B84A8]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: email_cua_ban@gmail.com"
                      className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center font-bold text-xs sm:text-sm py-3.5 shadow-lg shadow-[#7C3AED]/25 cursor-pointer mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Gửi Mã Xác Thực Khôi Phục
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CBC7E0]">Mã xác thực (OTP)</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Nhập mã xác thực (VD: 889922)"
                    className="w-full bg-[#161626] border border-white/10 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] font-mono transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CBC7E0]">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B84A8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-10 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8B84A8] hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#CBC7E0]">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B84A8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center font-bold text-xs sm:text-sm py-3.5 shadow-lg shadow-[#7C3AED]/25 cursor-pointer mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Xác Nhận & Cập Nhật Mật Khẩu
                </Button>
              </form>
            )}

            {/* Support from Admin */}
            <div className="p-4 rounded-2xl bg-[#161626]/60 border border-white/5 space-y-2 text-xs">
              <div className="font-semibold text-[#F0EDFF] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quên email hoặc cần hỗ trợ mở lại tài khoản?</span>
              </div>
              <p className="text-[11px] text-[#8B84A8] leading-relaxed">
                Liên hệ trực tiếp Admin để được hỗ trợ xác minh và cấp lại mật khẩu ngay lập tức:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="https://t.me/quangthank"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-center font-bold text-[11px] transition-colors"
                >
                  Telegram: @quangthank
                </a>
                <a
                  href="https://zalo.me/0916396901"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-center font-bold text-[11px] transition-colors"
                >
                  Zalo: 0916396901
                </a>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-xs text-[#8B84A8] hover:text-white transition-colors"
              >
                Đã nhớ lại mật khẩu? <span className="text-[#9D5CF6] font-semibold">Đăng nhập ngay</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
