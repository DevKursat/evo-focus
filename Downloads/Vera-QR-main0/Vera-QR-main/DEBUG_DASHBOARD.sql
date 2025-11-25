-- SON ÇAĞRILARI VE RESTORAN ID'LERİNİ KONTROL ET
SELECT 
    id, 
    restaurant_id, 
    table_number, 
    customer_name, 
    status, 
    created_at 
FROM waiter_calls 
ORDER BY created_at DESC 
LIMIT 5;

-- RESTORAN ADMİNLERİNİ KONTROL ET (Hangi kullanıcı hangi restorana bakıyor?)
SELECT 
    ra.profile_id, 
    ra.restaurant_id, 
    r.name as restaurant_name
FROM restaurant_admins ra
JOIN restaurants r ON ra.restaurant_id = r.id;
