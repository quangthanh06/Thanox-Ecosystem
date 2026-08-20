const fs = require('fs');
fetch('https://thanoxstorebot.shop/account')
  .then(res => res.text())
  .then(async html => {
     console.log('HTML length:', html.length);
     if (html.includes('Tải Lại Trang Ngay') || html.includes('dữ liệu mới')) {
       console.log('FOUND IN HTML!');
     } else {
       console.log('Not in HTML. Looking for scripts...');
       const matches = html.match(/src=['"]([^'"]+)['"]/g);
       if (matches) {
         for (const m of matches) {
           const src = m.replace(/src=['"]/, '').replace(/['"]$/, '');
           if (src.endsWith('.js')) {
             console.log('Fetching:', src);
             let url = src;
             if (src.startsWith('/')) url = 'https://thanoxstorebot.shop' + src;
             const js = await fetch(url).then(r => r.text());
             if (js.includes('Tải Lại Trang Ngay') || js.includes('dữ liệu mới') || js.includes('Hệ thống đang tải dữ liệu mới')) {
                console.log('FOUND IN JS FILE:', url);
             } else {
                console.log('NOT found in', url);
             }
           }
         }
       }
     }
  })
  .catch(console.error);
