const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

// 1. fetchSupabaseUsers
file = file.replace(/\.from\('users'\)/g, ".from('profiles')");
file = file.replace(/password: u\.password,/g, "password: '***',");

// 2. login
const loginRegex = /const login = async \([\s\S]*?return \{ success: false, message: 'L?i máy ch?, vui lòng th? l?i\.' \};\n\s*\}\n\s*\};/m;
const newLogin = `const login = async (identifier: string, password: string, _rememberMe = true): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) return { success: false, message: 'Vui lòng nh?p tên dang nh?p ho?c email' };
    try {
      let targetEmail = cleanId;
      if (!cleanId.includes('@')) {
        const { data: profile } = await supabase.from('profiles').select('email').eq('username', cleanId).single();
        if (profile && profile.email) {
          targetEmail = profile.email;
        } else {
          return { success: false, message: 'Sai tài kho?n ho?c m?t kh?u.' };
        }
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });
      if (authError || !authData.user) {
        return { success: false, message: 'Sai tài kho?n ho?c m?t kh?u.' };
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: 'L?i máy ch?, vui lòng th? l?i.' };
    }
  };`;
file = file.replace(loginRegex, newLogin);

// 3. register
const registerRegex = /const register = async \([\s\S]*?return \{ success: false, message: 'Ðã x?y ra l?i k?t n?i\. Vui lòng th? l?i sau\.' \};\n\s*\}\n\s*\};/m;
const newRegister = `const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) return { success: false, message: 'Tên dang nh?p ph?i có ít nh?t 3 ký t?.' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return { success: false, message: 'Tên dang nh?p ch? bao g?m ch? cái, s? và d?u g?ch du?i (_).' };
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return { success: false, message: 'Ð?a ch? email không h?p l?.' };
    if (!password || password.length < 6) return { success: false, message: 'M?t kh?u ph?i có ít nh?t 6 ký t?.' };
    try {
      const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', cleanUsername).single();
      if (existingUser) return { success: false, message: 'Tên dang nh?p dã du?c s? d?ng.' };
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: { data: { username: cleanUsername } }
      });
      if (authError) {
        let msg = 'Ðang ký không thành công.';
        if (authError.message.includes('already registered')) msg = 'Email này dã du?c s? d?ng.';
        return { success: false, message: msg };
      }
      showToast('Ðang ký tài kho?n thành công!', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Ðã x?y ra l?i k?t n?i. Vui lòng th? l?i sau.' };
    }
  };`;
file = file.replace(registerRegex, newRegister);

// 4. logout
const logoutRegex = /const logout = \(\) => \{\n\s*setCurrentUserId\(null\);\n\s*showToast\('Ðã dang xu?t kh?i h? th?ng', 'info'\);\n\s*\};/m;
const newLogout = `const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setCurrentUser(null);
    showToast('Ðã dang xu?t kh?i h? th?ng', 'info');
  };`;
file = file.replace(logoutRegex, newLogout);

// 5. Auth Listener (Session persistence)
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
file = file.replace(currentUserRegex, newCurrentUser);

// 6. Types in interface
file = file.replace(/requestPasswordReset: \(email: string\) => \{ success: boolean; message\?: string; otp\?: string \};/g, "requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; otp?: string }>;");
file = file.replace(/resetPassword: \(email: string, otpOrToken: string, newPassword: string\) => \{ success: boolean; message\?: string \};/g, "resetPassword: (email: string, otpOrToken: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;");
file = file.replace(/login: \(identifier: string, password: string, rememberMe\?: boolean\) => \{ success: boolean; message\?: string \};/g, "login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;");
file = file.replace(/register: \(username: string, email: string, password: string\) => \{ success: boolean; message\?: string \};/g, "register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;");

// 7. Reset password (Using split and strict string replacement)
function replaceFunctionStrict(fileContent, startString, endString, newString) {
  const startIndex = fileContent.indexOf(startString);
  const endIndex = fileContent.indexOf(endString, startIndex);
  if (startIndex === -1 || endIndex === -1) return fileContent;
  const before = fileContent.substring(0, startIndex);
  const after = fileContent.substring(endIndex + endString.length);
  return before + newString + after;
}

const reqStart = "const requestPasswordReset = (email: string): { success: boolean; message?: string; otp?: string } => {";
const reqEnd = "return { success: true, otp };\n  };";
const newReq = `const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; otp?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, message: 'Vui lòng nh?p d?a ch? email h?p l?.' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin + '/login' });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã g?i liên k?t d?t l?i m?t kh?u qua email!' };
    } catch (e) { return { success: false, message: 'L?i g?i yêu c?u' }; }
  };`;
file = replaceFunctionStrict(file, reqStart, reqEnd, newReq);

const resStart = "const resetPassword = (\n    email: string,\n    otpOrToken: string,\n    newPassword: string\n  ): { success: boolean; message?: string } => {";
const resEnd = "return { success: true };\n  };";
const newRes = `const resetPassword = async (email: string, otpOrToken: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Ðã d?i m?t kh?u thành công!' };
    } catch(e) { return { success: false, message: 'L?i d?i m?t kh?u' }; }
  };`;
file = replaceFunctionStrict(file, resStart, resEnd, newRes);

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Final safe patch applied!');
