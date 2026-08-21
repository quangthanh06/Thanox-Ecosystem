const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const replacements = {
    'Vui lng nh?p tn dang nh?p ho?c email': 'Vui lòng nhập tên đăng nhập hoặc email',
    'Sai ti kho?n ho?c m?t kh?u.': 'Sai tài khoản hoặc mật khẩu.',
    'L?i my ch?, vui lng th? l?i.': 'Lỗi máy chủ, vui lòng thử lại.',
    '?A `ng nh-p khA\'ng thAnh cA\'ng': 'Đăng nhập không thành công',
    'Vui lAng nh-p tAn `ng nh-p hoc email': 'Vui lòng nhập tên đăng nhập hoặc email',
    'Vui lAng nh-p m-t khcu': 'Vui lòng nhập mật khẩu',
    'Vui lAng nh-p mA 6 s` t cng dng Google Authenticator trAn `in thoi': 'Vui lòng nhập mã 6 số từ ứng dụng Google Authenticator trên điện thoại',
    'MA OTP Google Authenticator khA\'ng chA-nh xAc hoc `A ht hn': 'Mã OTP Google Authenticator không chính xác hoặc đã hết hạn',
    'Vui lAng nh-p `<a ch% email hp l': 'Vui lòng nhập địa chỉ email hợp lệ',
    'MA xAc thc 6 s` `A `c to cho email': 'Mã xác thực 6 số đã được tạo cho email',
    'Vui lAng nhp mA vA\n mt khcu m>i bAn d>i.': 'Vui lòng nhập mã và mật khẩu mới bên dưới.',
    'KhA\'ng tAm thy tAi khon v>i email nAy': 'Không tìm thấy tài khoản với email này',
    'Vui lng nh?p m xc th?c g?m 6 ch? s?': 'Vui lòng nhập mã xác thực gồm 6 chữ số',
    'M?t kh?u m?i ph?i c t nh?t 6 k t?': 'Mật khẩu mới phải có ít nhất 6 ký tự',
    'M?t kh?u xc nh?n khng kh?p': 'Mật khẩu xác nhận không khớp',
    'M xc th?c khng chnh xc ho?c d h?t h?n': 'Mã xác thực không chính xác hoặc đã hết hạn',
    'L?i h? th?ng': 'Lỗi hệ thống',
    '?A to Secret Key m>i:': 'Đã tạo Secret Key mới:',
    'HAy quAct li mA QR trAn `in thoi!': 'Hãy quét lại mã QR trên điện thoại!',
    'o. MA OTP chAnh xAc! Google Authenticator `A kt n`i thAnh cA\'ng v>i Shop.': '🎉 Mã OTP chính xác! Google Authenticator đã kết nối thành công với Shop.',
    'MA OTP khA\'ng `Ang hoc `A ht hn': 'Mã OTP không đúng hoặc đã hết hạn',
    '?A sao chAcp Secret Key vAo bT nh> tm!': 'Đã sao chép Secret Key vào bộ nhớ tạm!',
    'MY cng dng Google Authenticator trAn `in thoi Android hoc iPhone, quAct mA QR \nd>i `Ay ` kAch hot bo v 2 l>p.': 'Mở ứng dụng Google Authenticator trên điện thoại Android hoặc iPhone, quét mã QR dưới đây để kích hoạt bảo vệ 2 lớp.',
    'dYY 2FA ?ang B-t': '✅ 2FA Đang Bật',
    's 2FA ?ang T_t': '❌ 2FA Đang Tắt',
    'QuAct mA trAn Google Authenticator': 'Quét mã trên Google Authenticator',
    'KhA3a BA- M-t (Secret Key)': 'Khóa Bảo Mật (Secret Key)',
    '(to khA3a m>i)': '(tạo khóa mới)',
    'Nh-p mA nAy th  cA\'ng vAo app nu camera `in thoi khA\'ng th quAct mA QR.': 'Nhập mã này thủ công vào app nếu camera điện thoại không thể quét mã QR.',
    'XAc nh-n mA OTP': 'Xác nhận mã OTP',
    'Nh-p mA 6 s` t app \n                            Authenticator ` kim tra': 'Nhập mã 6 số từ app Authenticator để kiểm tra',
    'XAc Nh-n MA': 'Xác Nhận Mã'
  };

  let modified = false;
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed encoding in ${path.basename(filePath)}`);
  }
}

['src/context/StoreContext.tsx', 
 'src/components/storefront/StorefrontLogin.tsx',
 'src/components/storefront/StorefrontForgotPassword.tsx',
 'src/components/SettingsView.tsx'
].forEach(fixFile);
