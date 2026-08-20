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
  Flame,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Share2,
  Gift,
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

    if (score <= 1) return { score: 1, label: 'Yếu', color: 'bg-red-500 text-red-400' };
    if (score === 2) return { score: 2, label: 'Trung bình', color: 'bg-amber-500 text-amber-400' };
    return { score: 3, label: 'Mạnh & An toàn', color: 'bg-emerald-500 text-emerald-400' };
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
    register(cleanUsername, cleanEmail, password).then(res => {
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
          <div className="bg-[#0F0F1A]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-6">
            {/* Top Switcher Tabs (Login / Register) */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/5">
                <Link
                  to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-all text-[#8B84A8] hover:text-white"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30"
                >
                  Tạo Tài Khoản
                </Link>
              </div>

              <Link
                to="/"
                className="text-xs text-[#8B84A8] hover:text-[#9D5CF6] transition-colors"
              >
                Về Trang Chủ &rarr;
              </Link>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F0EDFF] tracking-tight">
                Tạo tài khoản Thanox 🚀
              </h1>
              <p className="text-xs sm:text-sm text-[#8B84A8]">
                Đăng ký ngay để nhận ưu đãi thành viên và lưu trữ License vĩnh viễn
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#CBC7E0]">
                  Tên đăng nhập (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B84A8]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="VD: pro_player_99"
                    className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#CBC7E0]">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B84A8]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: player@gmail.com"
                    className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#CBC7E0]">Mật khẩu (tối thiểu 6 ký tự)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B84A8]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tạo mật khẩu an toàn..."
                    className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-10 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    autoComplete="new-password"
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1 pt-1 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8B84A8]">Độ mạnh mật khẩu:</span>
                      <span className={`font-semibold ${strength.color.split(' ')[1]}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-1">
                      <div className={`rounded-full h-full ${strength.score >= 1 ? (strength.score === 1 ? 'bg-red-500' : strength.score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/10'}`} />
                      <div className={`rounded-full h-full ${strength.score >= 2 ? (strength.score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/10'}`} />
                      <div className={`rounded-full h-full ${strength.score >= 3 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#CBC7E0]">Nhập lại mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B84A8]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận lại mật khẩu..."
                    className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs sm:text-sm text-[#F0EDFF] placeholder-[#6B658E] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Referral Code Optional Input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-[#CBC7E0] flex items-center justify-between">
                  <span>Mã người giới thiệu (Không bắt buộc)</span>
                  <span className="text-[11px] text-[#9D5CF6]">Affiliate Reward</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                    <Gift className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={refCodeInput}
                    onChange={(e) => setRefCodeInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giới thiệu (nếu có)..."
                    className="w-full bg-[#161626] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-amber-300 placeholder-[#6B658E] focus:outline-none focus:border-amber-500/50 font-mono uppercase transition-colors"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[#8B84A8] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-[#161626] border-white/20 text-[#7C3AED] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <span className="text-[#9D5CF6] hover:underline">Điều khoản dịch vụ</span> &{' '}
                    <span className="text-[#9D5CF6] hover:underline">Chính sách bảo mật</span> của Thanox
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center font-bold text-xs sm:text-sm py-3.5 shadow-lg shadow-[#7C3AED]/25 cursor-pointer mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Tạo Tài Khoản Ngay
              </Button>
            </form>

            {/* Login Link Footer */}
            <div className="text-center text-xs text-[#8B84A8] pt-1">
              Đã có tài khoản?{' '}
              <Link
                to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="font-bold text-[#9D5CF6] hover:text-[#C084FC] transition-colors"
              >
                Đăng nhập tại đây
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
