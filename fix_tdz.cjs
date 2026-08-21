const fs = require('fs');
const file = 'src/context/StoreContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldUseEffect = `    useEffect(() => {
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
    }, []);`;

const newUseEffect = `    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setCurrentUserId(session.user.id);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setCurrentUserId(session.user.id);
        } else {
          setCurrentUserId(null);
        }
      });
      return () => subscription.unsubscribe();
    }, []);`;

if (content.includes(oldUseEffect)) {
  content = content.replace(oldUseEffect, newUseEffect);
  fs.writeFileSync(file, content, 'utf8');
  console.log("FIXED TDZ ERROR!");
} else {
  console.log("NOT FOUND!");
}
