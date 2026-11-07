const products = [
  {
    id: 1,
    name: 'PUBG UC 60 TL',
    category: 'PUBG UC',
    price: 60,
    icon: '🎮',
    badge: 'Popüler',
    description: 'Hızlı teslimat ve güvenli işlem.',
  },
  {
    id: 2,
    name: 'PUBG UC 120 TL',
    category: 'PUBG UC',
    price: 120,
    icon: '💎',
    badge: 'Yeni',
    description: 'Yüksek miktar paket seçeneği.',
  },
  {
    id: 3,
    name: 'Premium Oyun Hesabı',
    category: 'Oyun Hesapları',
    price: 299,
    icon: '🧩',
    badge: 'VIP',
    description: 'Premium özellikler ve özel erişim.',
  },
  {
    id: 4,
    name: 'Steam Hediye Kartı',
    category: 'Dijital Ürünler',
    price: 150,
    icon: '🎁',
    badge: 'Fırsat',
    description: 'Anlık kullanım için dijital kod.',
  },
  {
    id: 5,
    name: 'Valorant VP Paketi',
    category: 'Oyun Ürünleri',
    price: 210,
    icon: '🔫',
    badge: 'Öne Çıkan',
    description: 'Kısa sürede teslim edilen kod.',
  },
  {
    id: 6,
    name: 'Instagram Hesap Paketi',
    category: 'Dijital Ürünler',
    price: 180,
    icon: '📱',
    badge: 'Yeni',
    description: 'Hızlı erişim ve güvenli kullanım.',
  },
  {
    id: 7,
    name: 'Oyun Kayıt Paketi',
    category: 'Kampanyalar',
    price: 89,
    icon: '🎯',
    badge: 'Kampanya',
    description: 'Yeni başlayanlar için uygun paket.',
  },
  {
    id: 8,
    name: 'Dijital Abonelik',
    category: 'Dijital Ürünler',
    price: 99,
    icon: '📦',
    badge: 'Sürekli',
    description: 'Aylık erişim ve özel içerikler.',
  },
];

const cart = [];
const orderHistory = [
  { id: 'TR-1048', total: '₺299', status: 'Teslim Edildi' },
  { id: 'TR-1052', total: '₺120', status: 'Hazırlanıyor' },
  { id: 'TR-1061', total: '₺89', status: 'İşlemde' },
];

const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const overlay = document.getElementById('overlay');
const searchInput = document.getElementById('mainSearch');
const searchBtn = document.getElementById('searchBtn');
const orderList = document.getElementById('orderList');

function formatMoney(value) {
  return `₺${value.toLocaleString('tr-TR')}`;
}

function renderProducts(filtered = products) {
  productGrid.innerHTML = filtered
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image">${product.icon}</div>
          <div class="product-body">
            <span class="product-badge">${product.badge}</span>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-meta">
              <span class="product-price">${formatMoney(product.price)}</span>
              <span>${product.category}</span>
            </div>
            <button class="primary-btn add-to-cart" data-product-id="${product.id}">Sepete Ekle</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', (event) => {
      const productId = Number(event.currentTarget.dataset.productId);
      const product = products.find((item) => item.id === productId);
      if (!product) return;

      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }

      renderCart();
      openCart();
    });
  });
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = '<p class="demo-note">Sepetiniz şu anda boş. Ürün ekleyerek başlayın.</p>';
    cartTotal.textContent = '₺0';
    cartCount.textContent = '0';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div class="cart-item-icon">${item.icon}</div>
          <div>
            <h4>${item.name}</h4>
            <p>${item.quantity} adet</p>
            <strong>${formatMoney(item.price * item.quantity)}</strong>
          </div>
          <button class="remove-btn" data-remove-id="${item.id}" aria-label="Ürünü kaldır">✕</button>
        </div>
      `
    )
    .join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatMoney(total);
  cartCount.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));

  document.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const removeId = Number(button.dataset.removeId);
      const itemIndex = cart.findIndex((item) => item.id === removeId);
      if (itemIndex >= 0) {
        cart.splice(itemIndex, 1);
        renderCart();
      }
    });
  });
}

function openCart() {
  cartPanel.classList.add('open');
  overlay.classList.add('show');
}

function closeCart() {
  cartPanel.classList.remove('open');
  overlay.classList.remove('show');
}

function filterProducts() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = !term
    ? products
    : products.filter((product) => {
        return (
          product.name.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term)
        );
      });

  renderProducts(filtered);
}

function renderOrders() {
  orderList.innerHTML = orderHistory
    .map(
      (order) => `
        <div class="order-item">
          <div>
            <strong>${order.id}</strong>
            <small>${order.status}</small>
          </div>
          <span class="order-total">${order.total}</span>
        </div>
      `
    )
    .join('');
}

searchBtn.addEventListener('click', filterProducts);
searchInput.addEventListener('input', filterProducts);

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (!cart.length) {
    alert('Sepetiniz boş. Lütfen bir ürün ekleyin.');
    return;
  }

  alert('Demo ödeme sistemi kullanılıyor. Gerçek ödeme ve teslimat işlemleri için güvenli sunucu tarafı entegrasyonu gerekir.');
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  orderHistory.unshift({
    id: `TR-${Math.floor(Math.random() * 9000 + 1000)}`,
    total: formatMoney(total),
    status: 'Ödeme Bekleniyor',
  });
  cart.length = 0;
  renderCart();
  renderOrders();
  closeCart();
});

document.querySelectorAll('[data-open-auth]').forEach((button) => {
  button.addEventListener('click', () => {
    const form = button.dataset.openAuth;
    document.querySelectorAll('.tab-btn').forEach((tab) => {
      const isActive = tab.dataset.authTab === form;
      tab.classList.toggle('active', isActive);
    });

    document.getElementById('loginForm').classList.toggle('active', form === 'login');
    document.getElementById('registerForm').classList.toggle('active', form === 'register');
  });
});

document.querySelectorAll('.tab-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.authTab;
    document.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.toggle('active', tab === button));
    document.getElementById('loginForm').classList.toggle('active', type === 'login');
    document.getElementById('registerForm').classList.toggle('active', type === 'register');
  });
});

document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  alert('Giriş başarılı! Demo kullanıcı oturumu başlatıldı.');
});

document.getElementById('registerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  alert('Kayıt başarılı! Hesabınız oluşturuldu.');
});

document.getElementById('supportForm').addEventListener('submit', (event) => {
  event.preventDefault();
  alert('Destek talebiniz başarıyla gönderildi. En kısa sürede dönüş yapılacaktır.');
  event.currentTarget.reset();
});

renderProducts();
renderCart();
renderOrders();

