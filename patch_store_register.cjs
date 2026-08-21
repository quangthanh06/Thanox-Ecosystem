const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const registerRegex = /const register = async \([\s\S]*?return \{ success: true \};\n\s*\} catch \(err\) \{\n\s*console\.error\('L?i dang ký:', err\);\n\s*return \{ success: false, message: 'Ðã x?y ra l?i k?t n?i\. Vui lòng th? l?i sau\.' \};\n\s*\}\n\s*\};/m;

const newRegister = `const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) return { success: false, message: 'Tên dang nh?p ph?i có ít nh?t 3 ký t?.' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return { success: false, message: 'Tên dang nh?p ch? bao g?m ch? cái, s? và d?u g?ch du?i (_).' };
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return { success: false, message: 'Ð?a ch? email không h?p l?.' };
    if (!password || password.length < 6) return { success: false, message: 'M?t kh?u ph?i có ít nh?t 6 ký t?.' };

    try {
      // 1. Ki?m tra Username có t?n t?i trong profiles chua
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .single();
        
      if (existingUser) {
        return { success: false, message: 'Tên dang nh?p dã du?c s? d?ng.' };
      }

      // 2. Ðang ký b?ng Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            username: cleanUsername,
          }
        }
      });

      if (authError) {
        let msg = 'Ðang ký không thành công.';
        if (authError.message.includes('already registered')) msg = 'Email này dã du?c s? d?ng.';
        return { success: false, message: msg };
      }

      // Trigger trong DB s? t? d?ng t?o profile.
      showToast('Ðang ký tài kho?n thành công!', 'success');
      return { success: true };
    } catch (err) {
      console.error('L?i dang ký:', err);
      return { success: false, message: 'Ðã x?y ra l?i k?t n?i. Vui lòng th? l?i sau.' };
    }
  };`;

file = file.replace(registerRegex, newRegister);
fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched Register!');
