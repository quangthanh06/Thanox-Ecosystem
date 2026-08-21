const fs = require('fs');

// Helpers
function replaceFunctionSmart(fileContent, funcName, newFuncStr) {
  const startStr = `const ${funcName} =`;
  let startIndex = fileContent.indexOf(startStr);
  if (startIndex === -1) return fileContent;
  let blockStart = fileContent.indexOf('{', fileContent.indexOf('=>', startIndex));
  if (blockStart === -1) blockStart = fileContent.indexOf('{', startIndex);
  let openBraces = 0;
  let started = false;
  let endIndex = -1;
  for(let i = blockStart; i < fileContent.length; i++) {
    if (fileContent[i] === '{') { openBraces++; started = true; }
    else if (fileContent[i] === '}') {
      openBraces--;
      if (started && openBraces === 0) {
        endIndex = fileContent[i+1] === ';' ? i + 2 : i + 1;
        break;
      }
    }
  }
  if (endIndex === -1) return fileContent;
  return fileContent.substring(0, startIndex) + newFuncStr + fileContent.substring(endIndex);
}

// 1. StorefrontForgotPassword.tsx
let forgot = fs.readFileSync('src/components/storefront/StorefrontForgotPassword.tsx', 'utf8');
forgot = forgot.replace(/const handleRequestSubmit = \(e: React\.FormEvent\) => \{/g, 'const handleRequestSubmit = async (e: React.FormEvent) => {');
forgot = forgot.replace(/const handleResetSubmit = \(e: React\.FormEvent\) => \{/g, 'const handleResetSubmit = async (e: React.FormEvent) => {');
forgot = forgot.replace(/confirmPasswordReset/g, 'resetPassword');

forgot = forgot.replace(/setTimeout\(\(\) => \{[\s\S]*?\}, 400\);/g, 
`try {
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
    }`);

forgot = forgot.replace(/setTimeout\(\(\) => \{[\s\S]*?\}, 1000\);/g,
`try {
      const res = await resetPassword(email.trim().toLowerCase(), resetCode.trim(), newPassword);
      setIsLoading(false);
      if (res.success) {
        showToast('Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.', 'success');
        navigate('/login', { replace: true });
      } else {
        setErrorMessage(res.message || 'Mã xác thực không chính xác hoặc đã hết hạn');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Lỗi hệ thống');
    }`);

fs.writeFileSync('src/components/storefront/StorefrontForgotPassword.tsx', forgot, 'utf8');


// 2. SettingsView.tsx
let settings = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
const stateMarker = "const [totpTestResult, setTotpTestResult] = useState<{ valid: boolean; reason?: string } | null>(null);";
const stateReplacement = stateMarker + "\n  const [pendingTwoFactorSecret, setPendingTwoFactorSecret] = useState<string | null>(null);";
settings = settings.replace(stateMarker, stateReplacement);

const generateFuncRegex = /const handleGenerateNewSecret = \(\) => \{[\s\S]*?showToast\([^)]+\);\n\s*\};/m;
const newGenerateFunc = `const handleGenerateNewSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let newSec = '';
    for (let i = 0; i < 16; i++) {
      newSec += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPendingTwoFactorSecret(newSec);
    setTotpTestResult(null);
    setTotpTestCode('');
    showToast(\`Đã tạo Secret Key mới: \${newSec}. Hãy quét mã QR và xác nhận ngay bên dưới để áp dụng!\`, 'info');
  };`;
settings = settings.replace(generateFuncRegex, newGenerateFunc);

const verifyFuncRegex = /const handleVerifyTotpTest = \(\) => \{[\s\S]*?\}\n\s*\};/m;
const newVerifyFunc = `const handleVerifyTotpTest = () => {
    if (!totpTestCode.trim()) {
      showToast('Vui lòng nhập mã 6 số từ Google Authenticator trên điện thoại', 'error');
      return;
    }
    const secretToTest = pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
    const backup = formData.twoFactorBackupCode || '888999';
    const res = verifyTotpCode(secretToTest, totpTestCode.trim(), backup);
    setTotpTestResult(res);
    if (res.valid) {
      if (pendingTwoFactorSecret) {
        setFormData((prev) => ({ ...prev, twoFactorSecret: pendingTwoFactorSecret }));
        updateSettings({ twoFactorSecret: pendingTwoFactorSecret });
        setPendingTwoFactorSecret(null);
        showToast('🎉 Mã OTP chính xác! Secret Key mới đã được áp dụng và LƯU vào hệ thống.', 'success');
      } else {
        showToast('✅ Mã OTP chính xác! Google Authenticator đang hoạt động tốt.', 'success');
      }
    } else {
      showToast(res.reason || 'Mã OTP không đúng hoặc đã hết hạn', 'error');
    }
  };`;
settings = settings.replace(verifyFuncRegex, newVerifyFunc);

settings = settings.replace(/generateTotpUri\(formData\.twoFactorSecret \|\| 'JBSWY3DPEHPK3PXP'/g, "generateTotpUri(pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP'");
settings = settings.replace(/value=\{formData\.twoFactorSecret \|\| 'JBSWY3DPEHPK3PXP'\}/g, "value={pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}");
settings = settings.replace(/onClick=\{\(\) => copySecretToClipboard\(formData\.twoFactorSecret \|\| 'JBSWY3DPEHPK3PXP'\)\}/g, "onClick={() => copySecretToClipboard(pendingTwoFactorSecret || formData.twoFactorSecret || 'JBSWY3DPEHPK3PXP')}");

fs.writeFileSync('src/components/SettingsView.tsx', settings, 'utf8');


// 3. StoreContext.tsx
let ctx = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const newLogin = `const login = async (identifier: string, password: string, _rememberMe = true): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) return { success: false, message: 'Vui lòng nhập tên đăng nhập hoặc email' };
    try {
      let targetEmail = cleanId;
      if (!cleanId.includes('@')) {
        const { data: profile } = await supabase.from('profiles').select('email').eq('username', cleanId).single();
        if (profile && profile.email) {
          targetEmail = profile.email;
        } else {
          return { success: false, message: 'Sai tài khoản hoặc mật khẩu.' };
        }
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });
      if (authError || !authData.user) {
        return { success: false, message: 'Sai tài khoản hoặc mật khẩu.' };
      }

      setCurrentUserId(authData.user.id);
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      if (profile) {
        const mappedUser: User = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          password: '***',
          role: profile.role as 'admin' | 'user',
          balance: Number(profile.balance) || 0,
          totalSpent: Number(profile.total_spent) || 0,
          status: profile.status as 'active' | 'banned',
          createdAt: profile.created_at,
          joinDate: new Date(profile.created_at).toISOString().replace('T', ' ').substring(0, 16),
        };
        setUsers(prev => {
          const exists = prev.find(u => u.id === mappedUser.id);
          if (exists) return prev.map(u => u.id === mappedUser.id ? mappedUser : u);
          return [...prev, mappedUser];
        });
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: 'Lỗi máy chủ, vui lòng thử lại.' };
    }
  };`;

const newRegister = `const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return { success: false, message: 'Tên đăng nhập chỉ bao gồm chữ cái, số và dấu gạch dưới (_).' };
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return { success: false, message: 'Địa chỉ email không hợp lệ.' };
    if (!password || password.length < 6) return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' };
    try {
      const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', cleanUsername).single();
      if (existingUser) return { success: false, message: 'Tên đăng nhập đã được sử dụng.' };
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: { data: { username: cleanUsername } }
      });
      if (authError) {
        let msg = 'Đăng ký không thành công.';
        if (authError.message.includes('already registered')) msg = 'Email này đã được sử dụng.';
        return { success: false, message: msg };
      }
      showToast('Đăng ký tài khoản thành công!', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.' };
    }
  };`;

const newLogout = `const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setCurrentUser(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };`;

const newRequestReset = `const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: 'Lỗi khi gửi email xác thực.' };
      return { success: true, message: 'Đã gửi email khôi phục mật khẩu.' };
    } catch (err) {
      return { success: false, message: 'Lỗi máy chủ.' };
    }
  };`;

const newReset = `const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpOrToken, type: 'recovery' });
      if (error) return { success: false, message: 'Mã xác thực không hợp lệ.' };
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return { success: false, message: 'Không thể cập nhật mật khẩu.' };
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Lỗi máy chủ.' };
    }
  };`;

ctx = replaceFunctionSmart(ctx, 'login', newLogin);
ctx = replaceFunctionSmart(ctx, 'register', newRegister);
ctx = replaceFunctionSmart(ctx, 'logout', newLogout);
ctx = replaceFunctionSmart(ctx, 'requestPasswordReset', newRequestReset);

// confirmPasswordReset might have been named something else or resetPassword
if (ctx.includes('const confirmPasswordReset =')) {
  ctx = replaceFunctionSmart(ctx, 'confirmPasswordReset', newReset);
} else {
  ctx = replaceFunctionSmart(ctx, 'resetPassword', newReset);
}

// Current User State Fix
const currentUserRegex = /\/\/ Current active user authentication state[\s\S]*?const fallbackUser: User = \{/m;
const newCurrentUser = `// Current active user authentication state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        fetchSupabaseUsers(); // Re-fetch to ensure the new user's profile is in the list
      } else {
        setCurrentUserId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fallbackUser: User = {`;
ctx = ctx.replace(currentUserRegex, newCurrentUser);

fs.writeFileSync('src/context/StoreContext.tsx', ctx, 'utf8');

console.log('Done rebuilding everything properly!');
