<!-- INTEGRATION GUIDE FOR YOUR PAGES -->

# Quick Integration Guide

## How to Add Cart Functionality to Your Pages

### Step 1: Link Cart Assets (in your <head>)
```html
<!-- Font Awesome for icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

<!-- Cart Styles -->
<link rel="stylesheet" href="cart.css" />
```

### Step 2: Load Cart Script (before closing </body>)
```html
<!-- Cart System -->
<script src="cart.JS"></script>
```

---

## Adding "Add to Cart" Buttons to Product Pages

### Simple HTML Button
```html
<button class="add-to-cart" 
        data-id="product1" 
        data-name="Chunky Sneaker 2024" 
        data-price="11291" 
        data-img="img/shoe1.jpg">
  <i class="fas fa-shopping-cart"></i> Add to Cart
</button>
```

**Data Attributes:**
- `data-id`: Unique product identifier
- `data-name`: Product display name
- `data-price`: Price in RWF (whole numbers)
- `data-img`: Product image URL (optional)

### JavaScript Button
```html
<button onclick="addProductToCart()">Add to Cart</button>

<script>
function addProductToCart() {
  if (window.KCart) {
    window.KCart.add({
      id: 'product-unique-id',
      name: 'Product Name',
      price: 11291,
      img: 'path/to/image.jpg',
      qty: 1
    });
  }
}
</script>
```

---

## Adding Cart Icon to Header

### Already Included in header.html
Your header already has:
```html
<button class="icon-btn cart-btn" id="cartBtn" aria-label="Shopping Cart">
  <i class="fas fa-shopping-cart"></i>
  <span class="icon-badge" id="cartBadge">0</span>
</button>
```

The badge automatically updates with the number of items in the cart.

---

## Navigation to Cart Pages

### From Any Page
```html
<!-- View full cart -->
<a href="cart.html">View Cart</a>

<!-- Go to checkout -->
<a href="checkout.html">Checkout</a>
```

### Programmatically
```javascript
// Go to cart
window.location.href = 'cart.html';

// Go to checkout
window.location.href = 'checkout.html';
```

---

## WhatsApp Integration Examples

### Trigger from Checkout
```html
<button id="whatsappBtn" onclick="orderViaWhatsApp()">
  <i class="fab fa-whatsapp"></i> Order on WhatsApp
</button>

<script>
function orderViaWhatsApp() {
  const customMsg = 'Please deliver after 6 PM';
  if (window.KCart) {
    window.KCart.openWhatsAppOrder(customMsg);
  }
}
</script>
```

### Trigger from Custom Button
```html
<button onclick="window.KCart.openWhatsAppOrder('')">
  <i class="fab fa-whatsapp"></i> WhatsApp Order
</button>
```

---

## Testing Your Integration

### 1. Test Add to Cart
```javascript
// In browser console:
window.KCart.add({
  id: 'test-product',
  name: 'Test Product',
  price: 5000,
  img: 'https://via.placeholder.com/80',
  qty: 1
});

// Check localStorage:
localStorage.getItem('kwizeraCart_v1');
```

### 2. Test Cart Rendering
```javascript
// Show current cart:
console.log(JSON.parse(localStorage.getItem('kwizeraCart_v1')));

// Clear cart:
window.KCart.clear();
```

### 3. Test WhatsApp
```javascript
// This will open WhatsApp with cart summary:
window.KCart.openWhatsAppOrder('Test message');
```

---

## Common Use Cases

### Product Detail Page
```html
<div class="product-card">
  <img src="product.jpg" alt="Product">
  <h2>Product Name</h2>
  <p class="price">RWF 15,000</p>
  
  <div class="qty-selector">
    <button onclick="qty = Math.max(1, qty-1)">-</button>
    <input type="number" id="quantity" value="1" min="1">
    <button onclick="qty = (parseInt(document.getElementById('quantity').value))+1; document.getElementById('quantity').value = qty;">+</button>
  </div>
  
  <button class="btn-add-cart" onclick="addToCart('product-id', 'Product Name', 15000)">
    Add to Cart
  </button>
</div>

<script>
function addToCart(id, name, price) {
  const qty = parseInt(document.getElementById('quantity').value) || 1;
  window.KCart.add({
    id: id,
    name: name,
    price: price,
    img: 'product.jpg',
    qty: qty
  });
}
</script>
```

### Shop Page with Multiple Products
```html
<div class="products-grid">
  <!-- Each product -->
  <div class="product">
    <img src="product1.jpg">
    <h3>Product 1</h3>
    <p class="price">RWF 5,000</p>
    <button class="add-to-cart" 
            data-id="prod-001" 
            data-name="Product 1" 
            data-price="5000" 
            data-img="product1.jpg">
      Add to Cart
    </button>
  </div>
  
  <!-- More products... -->
</div>

<!-- Cart JS handles all .add-to-cart clicks automatically -->
<script src="cart.JS"></script>
```

### Floating Cart Widget
The cart icon appears automatically in the top-right corner via `cart.JS`. No additional setup needed!

---

## Styling Your Buttons

### Recommended Button Styles
```css
/* Add to Cart Button */
.btn-add-cart {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-add-cart:hover {
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

/* WhatsApp Button */
.btn-whatsapp {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-whatsapp:hover {
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
  transform: translateY(-2px);
}
```

---

## Price Formatting

### Display Prices Correctly
```javascript
// Format price in RWF
function formatPrice(price) {
  return 'RWF ' + Number(price).toLocaleString('en-US');
}

// Example:
console.log(formatPrice(15000)); // Output: RWF 15,000
```

---

## LocalStorage Structure

### Cart Data Format
```json
[
  {
    "id": "product1",
    "name": "Product Name",
    "price": 10000,
    "img": "img/product.jpg",
    "qty": 2
  },
  {
    "id": "product2",
    "name": "Another Product",
    "price": 5000,
    "img": "img/product2.jpg",
    "qty": 1
  }
]
```

---

## Debugging Tips

### Check if KCart is loaded
```javascript
console.log(window.KCart); // Should show all methods
```

### View all events
```javascript
window.addEventListener('kcart:updated', () => {
  console.log('Cart updated!');
});
```

### Monitor localStorage changes
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'kwizeraCart_v1') {
    console.log('Cart changed:', e.newValue);
  }
});
```

---

## Mobile Optimization

### Your Pages Should Include
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### Cart Pages Are Already Mobile-Optimized
- `cart.html` - Responsive layout ✓
- `checkout.html` - Touch-friendly buttons ✓
- Cart sidebar - Full-screen on mobile ✓

---

## Next Steps

1. ✅ Include cart.JS and cart.css in your pages
2. ✅ Add "Add to Cart" buttons to product pages
3. ✅ Link to cart.html and checkout.html
4. ✅ Customize colors to match your brand
5. ✅ Test on mobile devices
6. ✅ Verify WhatsApp integration works

---

**For more details, see: CART_SYSTEM_README.md**
