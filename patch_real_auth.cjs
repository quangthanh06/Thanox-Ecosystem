const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

function replaceFunction(fileContent, funcName, newFuncStr) {
  const startStr = `const ${funcName} =`;
  let startIndex = fileContent.indexOf(startStr);
  if (startIndex === -1) {
    console.log('Could not find ' + funcName);
    return fileContent;
  }
  let openBraces = 0;
  let started = false;
  let endIndex = -1;
  for(let i = startIndex; i < fileContent.length; i++) {
    if (fileContent[i] === '{') {
      openBraces++; started = true;
    } else if (fileContent[i] === '}') {
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

const newLogout = `const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setCurrentUser(null);
    showToast('Ðã dang xu?t kh?i h? th?ng', 'info');
  };`;

file = replaceFunction(file, 'login', newLogin);
file = replaceFunction(file, 'register', newRegister);
file = replaceFunction(file, 'logout', newLogout);

// Also need to patch currentUser auth listener!
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


fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Real auth patch applied.');
