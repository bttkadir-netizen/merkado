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

function formatMoney(value) {
  return `₺${value.toLocaleString('tr-TR')}`;
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderProducts(filtered = products) {
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) return;

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
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const cartCount = document.getElementById('cartCount');

  if (!cartItems || !cartTotal || !cartCount) return;

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

  const total = getCartTotal();
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
  const cartPanel = document.getElementById('cartPanel');
  const overlay = document.getElementById('overlay');
  if (!cartPanel || !overlay) return;
  cartPanel.classList.add('open');
  overlay.classList.add('show');
}

function closeCart() {
  const cartPanel = document.getElementById('cartPanel');
  const overlay = document.getElementById('overlay');
  if (!cartPanel || !overlay) return;
  cartPanel.classList.remove('open');
  overlay.classList.remove('show');
}

function filterProducts() {
  const searchInput = document.getElementById('mainSearch');
  if (!searchInput) return;

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
  const orderList = document.getElementById('orderList');
  if (!orderList) return;

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

function setupForms() {
  document.querySelectorAll('[data-open-auth]').forEach((button) => {
    button.addEventListener('click', () => {
      const form = button.dataset.openAuth;
      document.querySelectorAll('.tab-btn').forEach((tab) => {
        const isActive = tab.dataset.authTab === form;
        tab.classList.toggle('active', isActive);
      });

      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      if (loginForm && registerForm) {
        loginForm.classList.toggle('active', form === 'login');
        registerForm.classList.toggle('active', form === 'register');
      }
    });
  });

  document.querySelectorAll('.tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.authTab;
      document.querySelectorAll('.tab-btn').forEach((tab) => tab.classList.toggle('active', tab === button));
      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      if (loginForm && registerForm) {
        loginForm.classList.toggle('active', type === 'login');
        registerForm.classList.toggle('active', type === 'register');
      }
    });
  });

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Giriş başarılı! Demo kullanıcı oturumu başlatıldı.');
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Kayıt başarılı! Hesabınız oluşturuldu.');
    });
  }

  const supportForm = document.getElementById('supportForm');
  if (supportForm) {
    supportForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Destek talebiniz başarıyla gönderildi. En kısa sürede dönüş yapılacaktır.');
      supportForm.reset();
    });
  }
}

function setupCart() {
  const cartToggle = document.getElementById('cartToggle');
  const closeCartBtn = document.getElementById('closeCart');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.addEventListener('click', closeCart);

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!cart.length) {
        alert('Sepetiniz boş. Lütfen bir ürün ekleyin.');
        return;
      }

      window.location.href = 'checkout.html';
    });
  }
}

function setupMainActions() {
  const mainProductBtn = document.querySelector('[data-main-product]');
  if (mainProductBtn) {
    mainProductBtn.addEventListener('click', () => {
      const item = products.find((product) => product.id === 1);
      if (!item) return;
      const existing = cart.find((entry) => entry.id === item.id);
      if (existing) existing.quantity += 1;
      else cart.push({ ...item, quantity: 1 });
      renderCart();
      openCart();
    });
  }

  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('mainSearch');
  if (searchBtn) searchBtn.addEventListener('click', filterProducts);
  if (searchInput) searchInput.addEventListener('input', filterProducts);
}

function initDetailPage() {
  const detailProduct = document.getElementById('detailProduct');
  if (!detailProduct) return;

  const current = products[0];
  detailProduct.innerHTML = `
    <div class="detail-panel">
      <div class="product-visual">${current.icon}</div>
      <h3 class="product-title">${current.name}</h3>
      <div class="detail-meta">
        <span class="meta-pill">${current.category}</span>
        <span class="meta-pill">Popüler seçim</span>
        <span class="meta-pill">Anlık teslimat</span>
      </div>
      <div class="detail-price">${formatMoney(current.price)}</div>
      <div class="detail-actions">
        <button class="primary-btn add-to-cart" data-product-id="${current.id}">Sepete Ekle</button>
        <button class="secondary-btn" onclick="location.href='index.html'">Anasayfaya Dön</button>
      </div>
      <ul class="detail-list">
        <li>Gerçek ödeme sistemi kurulana kadar demo ödeme kullanılır.</li>
        <li>Hızlı işlem ve güvenli teslimat akışı.</li>
        <li>Mobil uyumlu, Türkçe kullanıcı deneyimi.</li>
      </ul>
    </div>
  `;

  const addBtn = detailProduct.querySelector('.add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const item = products.find((entry) => entry.id === current.id);
      if (!item) return;
      const existing = cart.find((entry) => entry.id === item.id);
      if (existing) existing.quantity += 1;
      else cart.push({ ...item, quantity: 1 });
      renderCart();
      openCart();
    });
  }
}

function initAdminPage() {
  const adminTable = document.getElementById('adminTable');
  if (!adminTable) return;

  adminTable.innerHTML = products
    .map(
      (product) => `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${formatMoney(product.price)}</td>
          <td><span class="status-tag">Aktif</span></td>
          <td>128</td>
        </tr>
      `
    )
    .join('');

  const adminForm = document.getElementById('adminForm');
  if (adminForm) {
    adminForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Ürün kaydı demo olarak eklendi. Gerçek admin arka uç için sunucu tarafı entegrasyonu gerekir.');
      adminForm.reset();
    });
  }
}

function initCategoriesPage() {
  const categoryGrid = document.getElementById('categoryGrid');
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryGrid) return;

  const renderCategoryProducts = (filterValue = 'all') => {
    const visibleProducts = filterValue === 'all'
      ? products
      : products.filter((product) => product.category.toLowerCase() === filterValue.toLowerCase());

    categoryGrid.innerHTML = visibleProducts
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
        const existing = cart.find((entry) => entry.id === product.id);
        if (existing) existing.quantity += 1;
        else cart.push({ ...product, quantity: 1 });
        renderCart();
        openCart();
      });
    });
  };

  renderCategoryProducts();

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (event) => {
      renderCategoryProducts(event.target.value);
    });
  }
}

function initCheckoutPage() {
  const checkoutSummary = document.getElementById('checkoutSummary');
  const checkoutForm = document.getElementById('checkoutForm');
  if (!checkoutSummary || !checkoutForm) return;

  const total = getCartTotal();
  const shipping = cart.length ? 25 : 0;
  const finalTotal = total + shipping;

  checkoutSummary.innerHTML = `
    <div class="summary-box">
      <h3>Sipariş Özeti</h3>
      ${cart.length ? cart.map((item) => `
        <div class="sum-line">
          <span>${item.name} x ${item.quantity}</span>
          <strong>${formatMoney(item.price * item.quantity)}</strong>
        </div>
      `).join('') : '<p class="demo-note">Sepet boş.</p>'}
      <div class="sum-line"><span>Taşıma</span><strong>${formatMoney(shipping)}</strong></div>
      <div class="sum-line"><span>Toplam</span><strong>${formatMoney(finalTotal)}</strong></div>
    </div>
  `;

  checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('Demo ödeme onayı alındı. Gerçek ödeme ve teslimat için güvenli sunucu tarafı altyapısı gereklidir.');
    window.location.href = 'index.html';
  });
}

renderProducts();
renderCart();
renderOrders();
setupForms();
setupCart();
setupMainActions();
initDetailPage();
initAdminPage();
initCategoriesPage();
initCheckoutPage();
