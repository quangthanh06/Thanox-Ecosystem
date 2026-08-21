const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

// 1. Refactor Login
// We match from "const login = " to the end of the login function which ends at: return { success: true };\n    };\n
const loginRegex = /const login = async \([\s\S]*?return \{ success: true \};\n\s*\};/m;

const newLogin = `const login = async (identifier: string, password: string, _rememberMe = true): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) return { success: false, message: 'Vui lòng nh?p email ho?c tên dang nh?p' };
    
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
    } catch (e) {
      console.error(e);
      return { success: false, message: 'L?i máy ch?' };
    }
  };`;

file = file.replace(loginRegex, newLogin);

// 2. Refactor Logout
const logoutRegex = /const logout = \(\) => \{\n\s*setCurrentUserId\(null\);\n\s*showToast\([^)]+\);\n\s*\};/m;
const newLogout = `const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setCurrentUser(null);
    showToast('Ðã dang xu?t kh?i h? th?ng', 'info');
  };`;
  
file = file.replace(logoutRegex, newLogout);

// 3. Add Supabase Auth Listener (Session persistence)
const currentUserRegex = /\/\/ Current active user authentication state[\s\S]*?const fallbackUser: User = \{/m;
const newCurrentUser = `// Current active user authentication state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        fetchSupabaseUsers();
      } else {
        setCurrentUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fallbackUser: User = {`;

file = file.replace(currentUserRegex, newCurrentUser);

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched StoreContext.tsx Auth!');
