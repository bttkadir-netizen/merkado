# MERKADO

MERKADO, Türkçe siyah-altın temalı e-ticaret arayüzü ve API başlangıç projesidir.

## İstemci sayfaları

- `index.html` – mağaza ana sayfası
- `categories.html` – kategori filtreli ürün listesi
- `product.html` – ürün detay sayfası
- `checkout.html` – demo ödeme bilgilendirme ekranı
- `admin.html` – yönetim paneli arayüzü
- `styles.css` ve `script.js` – responsive tasarım ve tarayıcı demo etkileşimleri

## API başlangıcı

Gereksinim: Node.js 20 veya üzeri.

```bash
cp .env.example .env
```

`.env` içindeki `SESSION_SECRET` değerini uzun, rastgele ve gizli bir değerle değiştirin. Ardından:

```bash
npm install
npm start
```

API varsayılan olarak `http://localhost:3000` adresinde çalışır. İlk çalıştırmada `data/merkado.sqlite` SQLite veritabanı ve başlangıç ürünleri oluşturulur.

### API uç noktaları

- `GET /api/health` – sağlık kontrolü
- `GET /api/products` – aktif ürünler
- `GET /api/csrf` – oturum için CSRF token
- `POST /api/auth/register` – müşteri kaydı (en az 12 karakter şifre)
- `POST /api/auth/login` – oturum açma
- `GET /api/auth/me` – mevcut oturum
- `POST /api/auth/logout` – oturum kapatma
- `GET /api/admin/products` – yönetici ürün listesi
- `POST /api/admin/products` ve `PATCH /api/admin/products/:id` – yönetici ürün yönetimi
- `POST /api/orders` – bilerek kapalı; gerçek ödeme sağlayıcısı yapılandırılana kadar `503` döndürür

Durum değiştiren isteklerde, önce `/api/csrf` çağrısından alınan `csrfToken` değerini `X-CSRF-Token` başlığıyla gönderin. Oturum çerezi tarayıcı tarafından taşınır. Üretimde HTTPS kullanın ve `TRUST_PROXY=1` değerini yalnızca güvenilir HTTPS ters proxy arkasında ayarlayın.

## Güvenlik ve demo sınırları

- Ödeme entegrasyonu, kart verisi saklama, gerçek sipariş oluşturma ve teslimat bu projede etkin değildir. Arayüzdeki demo davranışları gerçek ödeme/teslimat olarak değerlendirilmemelidir.
- `/api/orders` kasıtlı olarak kapalıdır; gerçek ödeme sağlayıcısı için sunucu tarafı sipariş oluşturma, tutar/stoğu yeniden doğrulama, imzalı webhook doğrulama ve idempotency uygulanmadan etkinleştirilmemelidir.
- Kart numarası, CVV veya ödeme sırrı bu uygulamaya gönderilmemeli ya da saklanmamalıdır. Sağlayıcının barındırdığı ödeme sayfası/token akışı tercih edilmelidir.
- API oturum çerezi `HttpOnly`, `SameSite=Lax` ve üretimde `Secure` ayarlıdır; parola hash'leri bcrypt ile saklanır; kimlik doğrulama için hız sınırlaması ve durum değiştiren endpointlerde CSRF kontrolü vardır.
- Yönetici hesabı için herkese açık kayıt veya varsayılan şifre yoktur. Üretim ortamında yönetici rolü yalnızca güvenilir, ayrıcalıklı provisioning süreciyle atanmalıdır. Doğrudan SQLite dosyasını düzenlemek yalnızca yerel geliştirme içindir.
- Bu API başlangıcı henüz üretim için denetlenmiş değildir. Dağıtımdan önce güvenlik incelemesi, HTTPS, yedekleme, log/izleme, veri saklama ve gizlilik yükümlülükleri tamamlanmalıdır.

Ön yüz şu an kendi içinde demo akışlar kullanır; API'ye bağlanmış gerçek bir alışveriş/ödeme akışı değildir.
