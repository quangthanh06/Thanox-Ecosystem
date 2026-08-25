import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { AuthVisualSide } from './AuthVisualSide';
import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Share2,
  Home,
} from 'lucide-react';

export const StorefrontRegister: React.FC = () => {
  const { register, isAuthenticated, activeReferralCode } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCodeInput, setRefCodeInput] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Detect referral code from URL query or session storage
  useEffect(() => {
    const urlRef = searchParams.get('ref');
    const sessionRef = typeof window !== 'undefined' ? sessionStorage.getItem('thanox_ref') : null;
    const initialRef = urlRef || sessionRef || activeReferralCode || '';
    if (initialRef) {
      setRefCodeInput(initialRef.toUpperCase());
    }
  }, [searchParams, activeReferralCode]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Yếu', color: 'bg-red-500 text-red-300' };
    if (score === 2) return { score: 2, label: 'Trung bình', color: 'bg-amber-500 text-amber-300' };
    return { score: 3, label: 'Mạnh & An toàn', color: 'bg-emerald-500 text-emerald-300' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setErrorMessage('Tên đăng nhập chỉ bao gồm chữ cái, số và dấu gạch dưới (_)');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản sử dụng của Thanox');
      return;
    }

    // Save custom ref code if entered
    if (refCodeInput && typeof window !== 'undefined') {
      sessionStorage.setItem('thanox_ref', refCodeInput.trim().toUpperCase());
    }

    setIsLoading(true);
    register(cleanUsername, cleanEmail, password).then((res) => {
      setIsLoading(false);
      if (res.success) {
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMessage(res.message || 'Đăng ký không thành công');
      }
    });
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
          <div className="glass-prominent border border-white/12 shadow-[0_30px_70px_rgba(0,0,0,0.85)] rounded-3xl p-6 sm:p-10 space-y-6">
            {/* Top Switcher Tabs (Login / Register) & Back to Home */}
            <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-4">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-subtle border border-white/6">
                <Link
                  to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all text-[#938EB5] hover:text-white"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all btn-liquid-primary shadow-md"
                >
                  Đăng Ký
                </Link>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subtle hover:glass-standard text-xs text-[#938EB5] hover:text-[#F4F2FF] border border-white/8 transition-all font-medium shrink-0 active:scale-95 shadow-sm"
              >
                <Home className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span className="hidden sm:inline">Trang Chủ</span>
                <span className="sm:hidden">Home</span>
              </Link>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F4F2FF] tracking-tight">
                Tạo Tài Khoản Thanox 🚀
              </h1>
              <p className="text-xs sm:text-sm text-[#938EB5]">
                Đăng ký để nạp tiền tự động, nhận key bản quyền và tích lũy hoa hồng
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/12 border border-red-500/25 text-red-300 text-xs flex items-center gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F4F2FF]">Tên đăng nhập</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#938EB5]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="VD: member99"
                    className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-[#F4F2FF]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F4F2FF]">Địa chỉ Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#938EB5]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: user@example.com"
                    className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-[#F4F2FF]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F4F2FF]">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#938EB5]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự..."
                      className="w-full glass-input rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-[#F4F2FF]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#938EB5] hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F4F2FF]">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#938EB5]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu..."
                      className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-[#F4F2FF]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#938EB5]">Độ mạnh mật khẩu:</span>
                    <span className={`font-bold ${strength.color}`}>{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1">
                    <div className={`rounded-full ${strength.score >= 1 ? 'bg-red-500' : 'bg-white/10'}`} />
                    <div className={`rounded-full ${strength.score >= 2 ? 'bg-amber-500' : 'bg-white/10'}`} />
                    <div className={`rounded-full ${strength.score >= 3 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  </div>
                </div>
              )}

              {/* Referral Code (Optional) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-[#938EB5] flex items-center justify-between">
                  <span>Mã Người Giới Thiệu (Không bắt buộc)</span>
                  {refCodeInput && (
                    <span className="text-[10.5px] text-[#22D3EE] font-bold">✓ Đã gắn mã</span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#938EB5]">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={refCodeInput}
                    onChange={(e) => setRefCodeInput(e.target.value.toUpperCase())}
                    placeholder="VD: THANOX88"
                    className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-amber-300 font-mono font-bold tracking-wider"
                  />
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[#938EB5] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded-md bg-[#121220] border-white/20 text-[#7C3AED] focus:ring-0 focus:ring-offset-0 cursor-pointer mt-0.5"
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <span className="text-[#C084FC] font-semibold">Điều khoản sử dụng</span> và{' '}
                    <span className="text-[#C084FC] font-semibold">Chính sách bảo mật</span> của Thanox.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center font-black text-xs sm:text-sm py-3.5 shadow-lg shadow-[#7C3AED]/25 cursor-pointer mt-2 uppercase tracking-wide"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Đăng Ký Tài Khoản
              </Button>
            </form>

            {/* Login Link Footer */}
            <div className="text-center text-xs text-[#938EB5] pt-3 border-t border-white/6">
              Đã có tài khoản?{' '}
              <Link
                to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="font-bold text-[#C084FC] hover:text-white transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
