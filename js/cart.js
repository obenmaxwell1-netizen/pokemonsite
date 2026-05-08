// ===== CART UTILITY =====
const CART_KEY = 'pokevault_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  showToast(`✅ ${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  if (total > 0) { badge.style.display = 'flex'; badge.textContent = total; }
  else { badge.style.display = 'none'; }
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast-msg toast-${type}`;
  t.innerHTML = `<i class="fa ${type === 'success' ? 'fa-check-circle' : 'fa-circle-xmark'}" style="color:${type==='success'?'var(--green)':'var(--red)'}"></i><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function getCategoryLabel(cat) {
  const map = { 'japanese-pokemon':'Japanese Pokémon','korean-pokemon':'Korean Pokémon','chinese-pokemon':'Chinese Pokémon','one-piece':'One Piece TCG' };
  return map[cat] || cat;
}

function buildProductCard(p) {
  const img = p.images && p.images.length ? p.images[0] : '';
  const stockClass = p.stock_status === 'in_stock' ? 'stock-in' : 'stock-out';
  const stockLabel = p.stock_status === 'in_stock' ? 'In Stock' : 'Sold Out';
  return `
    <div class="product-card" onclick="window.location='product.html?id=${p.id}'">
      <div class="product-img-wrap">
        ${img ? `<img src="${encodeURI(img)}" alt="${p.name}" loading="lazy" onerror="this.parentElement.style.background='var(--bg-card)'"/>` : '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;">🃏</div>'}
        <span class="stock-badge ${stockClass}">${stockLabel}</span>
      </div>
      <div class="product-info">
        <div class="cat-tag">${getCategoryLabel(p.category)}</div>
        <h3>${p.name}</h3>
        <div class="product-footer">
          <span class="product-price">$${Number(p.price).toFixed(2)}</span>
          ${p.stock_status === 'in_stock' ? `<button class="add-to-cart-btn" onclick="event.stopPropagation();addToCart({id:'${p.id}',name:'${p.name.replace(/'/g,"\\'")}',price:${p.price},image:'${img}',category:'${p.category}'})"><i class="fa fa-plus"></i></button>` : ''}
        </div>
      </div>
    </div>`;
}

// Init badge on load
document.addEventListener('DOMContentLoaded', updateCartBadge);
