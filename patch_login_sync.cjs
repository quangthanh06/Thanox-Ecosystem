const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

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

      // Ð?i load profile tru?c khi redirect d? ProtectRoute không dá v? trang ch?
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
      return { success: false, message: 'L?i máy ch?, vui lòng th? l?i.' };
    }
  };`;

file = replaceFunctionSmart(file, 'login', newLogin);
fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched login to sync profile eagerly!');
