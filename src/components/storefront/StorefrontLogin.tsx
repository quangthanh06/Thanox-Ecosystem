import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { AuthVisualSide } from './AuthVisualSide';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { verifyTotpCode } from '../../utils/totp';

export const StorefrontLogin: React.FC = () => {
  const { login, isAuthenticated, users, settings } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc email');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    // Check if target user is Admin and 2FA is active
    const cleanId = identifier.trim().toLowerCase();
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (foundUser && foundUser.role === 'admin' && settings.enable2FA && step === 'credentials') {
      setStep('2fa');
      return;
    }

    setIsLoading(true);
    login(identifier, password, rememberMe).then((res) => {
      setIsLoading(false);
      if (res.success) {
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMessage(res.message || 'Đăng nhập không thành công');
      }
    });
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!totpCode.trim()) {
      setErrorMessage('Vui lòng nhập mã 6 số từ ứng dụng Google Authenticator trên điện thoại');
      return;
    }

    const secret = settings.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
    const backup = settings.twoFactorBackupCode || undefined;
    const verifyRes = verifyTotpCode(secret, totpCode.trim(), backup);

    if (!verifyRes.valid) {
      setErrorMessage(verifyRes.reason || 'Mã OTP Google Authenticator không chính xác hoặc đã hết hạn');
      return;
    }

    setIsLoading(true);
    login(identifier, password, rememberMe).then((res) => {
      setIsLoading(false);
      if (res.success) {
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMessage(res.message || 'Đăng nhập không thành công');
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
            {/* Top Switcher Tabs (Login / Register) */}
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div className="flex items-center gap-2 p-1 rounded-2xl glass-subtle border border-white/6">
                <Link
                  to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all btn-liquid-primary shadow-md"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all text-[#938EB5] hover:text-white"
                >
                  Tạo Tài Khoản
                </Link>
              </div>

              <Link
                to="/"
                className="text-xs text-[#938EB5] hover:text-[#C084FC] transition-colors font-medium"
              >
                Về Trang Chủ &rarr;
              </Link>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-[#F4F2FF] tracking-tight">
                {step === 'credentials' ? 'Chào mừng trở lại 👋' : 'Xác Thực Google Authenticator 📱'}
              </h1>
              <p className="text-xs sm:text-sm text-[#938EB5]">
                {step === 'credentials'
                  ? 'Đăng nhập để xem License Key, số dư ví và nạp tiền tự động'
                  : 'Nhập mã OTP 6 số từ ứng dụng Google Authenticator trên điện thoại của bạn để đăng nhập quản trị'}
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/12 border border-red-500/25 text-red-300 text-xs flex items-center gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Login Credentials Form */}
            {step === 'credentials' ? (
              <form onSubmit={handleSubmit} className="space-y-4.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F4F2FF]">
                    Tên đăng nhập hoặc Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#938EB5]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Nhập tên đăng nhập hoặc email..."
                      className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-[#F4F2FF]"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#F4F2FF]">Mật khẩu</label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-[#C084FC] hover:text-white transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#938EB5]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu của bạn..."
                      className="w-full glass-input rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-[#F4F2FF]"
                      autoComplete="current-password"
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

                {/* Remember me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-[#938EB5] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md bg-[#121220] border-white/20 text-[#7C3AED] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center font-black text-xs sm:text-sm py-3.5 shadow-lg shadow-[#7C3AED]/25 cursor-pointer mt-2 tracking-wide uppercase"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Đăng Nhập
                </Button>
              </form>
            ) : (
              /* STEP 2: Google Authenticator 2FA Verification Form */
              <form onSubmit={handle2FASubmit} className="space-y-5">
                <div className="p-4 rounded-2xl bg-amber-500/12 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-200">
                    <Smartphone className="w-4 h-4" />
                    Tài khoản Admin được bảo vệ bởi Google Authenticator
                  </div>
                  <p className="text-[11px] text-[#E2DEFA]">
                    Vui lòng mở ứng dụng Google Authenticator trên điện thoại và nhập mã xác thực 6 chữ số:
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F4F2FF] flex items-center justify-between">
                    <span>Mã OTP (6 chữ số)</span>
                    <span className="text-[10px] text-[#938EB5]">Đổi mã mới mỗi 30s</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-300">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="VD: 492810"
                      className="w-full glass-input rounded-2xl pl-10 pr-4 py-3.5 text-center font-mono font-black text-lg text-amber-300 tracking-[0.3em]"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center font-bold text-xs sm:text-sm py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 cursor-pointer"
                    isLoading={isLoading}
                    rightIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Xác Thực 2FA & Đăng Nhập
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setTotpCode('');
                      setErrorMessage(null);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs text-[#938EB5] hover:text-white transition-colors cursor-pointer"
                  >
                    ← Quay lại nhập mật khẩu
                  </button>
                </div>
              </form>
            )}

            {/* Register Link Footer */}
            <div className="text-center text-xs text-[#938EB5] pt-3 border-t border-white/6">
              Chưa có tài khoản?{' '}
              <Link
                to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="font-bold text-[#C084FC] hover:text-white transition-colors"
              >
                Đăng ký tài khoản miễn phí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
