const fs = require('fs');
let file = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

file = file.replace(/requestPasswordReset: \(email: string\) => \{ success: boolean; message\?: string; otp\?: string \};/g, 
  "requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; otp?: string }>;");

file = file.replace(/resetPassword: \(email: string, otpOrToken: string, newPassword: string\) => \{ success: boolean; message\?: string \};/g, 
  "resetPassword: (email: string, otpOrToken: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;");

file = file.replace(/login: \(identifier: string, password: string, rememberMe\?: boolean\) => \{ success: boolean; message\?: string \};/g,
  "login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;");

file = file.replace(/register: \(username: string, email: string, password: string\) => \{ success: boolean; message\?: string \};/g,
  "register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;");

fs.writeFileSync('src/context/StoreContext.tsx', file);
console.log('Patched types in StoreContext!');
