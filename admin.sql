-- Xóa tài kho?n admin cu n?u có d? tránh trùng l?p email/username
DELETE FROM public.users WHERE username = 'admin' OR email = 'admin@thanox.vn';

-- T?o tài kho?n Admin chu?n xác
INSERT INTO public.users (id, username, email, password, role, balance, status)
VALUES (
    gen_random_uuid(),
    'admin',
    'admin@thanox.vn',
    'adminthanox.vn',
    'admin',
    0,
    'active'
);

-- T?t 2FA t?m th?i d? d? dàng dang nh?p
UPDATE public.settings SET enable_2fa = false;
