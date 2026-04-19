# CATEGORIES SECTION - Quick Reference

## 📋 Quick Start (5 Minutes)

### 1. Add to Your HTML Head
```html
<link rel="stylesheet" href="css/categories.css">
```

### 2. Add Component HTML to Body
Copy entire content from `components/categories.html` and paste in your body.

### 3. Add Script Before </body>
```html
<script src="js/categories.js"></script>
```

### 4. Done! 
The Categories button in mobile navigation will now work.

---

## 🎯 Typical Usage Patterns

### Open Categories Modal Programmatically
```javascript
window.categoriesInstance.open();
```

### Close Categories Modal
```javascript
window.categoriesInstance.close();
```

### Get All Categories
```javascript
const categories = window.categoriesInstance.getAllCategories();
console.log(categories);
```

### Get Single Category
```javascript
const shoeCategory = window.categoriesInstance.getCategory('shoes');
console.log(shoeCategory);
// Output: { id: 'shoes', name: 'Shoes', icon: 'fa-solid fa-shoe-prints', ... }
```

### Update Categories Dynamically
```javascript
const newCategories = [
  { id: 'new1', name: 'New Category', icon: 'fa-solid fa-star', color: '#ff0000', path: 'shop.html?category=new1', count: 0 }
];
window.categoriesInstance.updateCategories(newCategories);
```

---

## 🎨 Quick Customization

### Change Primary Color
Edit `css/categories.css`:
```css
:root {
  --categories-primary: #YOUR_COLOR_HERE;
}
```

### Add New Category
Edit `js/categories.js` in the `CATEGORIES` array:
```javascript
{
  id: 'my-category',
  name: 'My Category',
  icon: 'fa-solid fa-star',
  color: '#ff6b6b',
  path: 'shop.html?category=my-category',
  count: 0
}
```

### Change Grid Columns
Edit `css/categories.css`:
```css
.categories-grid {
  grid-template-columns: repeat(4, 1fr); /* 4 columns */
  gap: var(--categories-spacing-lg);
}
```

### Disable Animations
In `css/categories.css`, find and modify:
```css
.categories-sheet {
  transition: none !important;
}

.category-card {
  transition: none !important;
}
```

---

## 🔗 Navigation Integration

### How Categories Navigate
Each category has a `path` property that determines navigation:
```javascript
path: 'shop.html?category=shoes'
```

### Handle Category Parameters in shop.html
```javascript
// In your shop.js or shop.html
const params = new URLSearchParams(window.location.search);
const category = params.get('category');

if (category) {
  // Filter products by category
  console.log('Showing products for:', category);
  filterProductsByCategory(category);
}
```

### Example shop.js Implementation
```javascript
function filterProductsByCategory(categoryId) {
  const allProducts = document.querySelectorAll('.product-card');
  
  allProducts.forEach(product => {
    const productCategory = product.dataset.category;
    if (productCategory === categoryId) {
      product.style.display = 'block';
    } else {
      product.style.display = 'none';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  if (category) {
    filterProductsByCategory(category);
  }
});
```

---

## 📊 Category Attributes

| Property | Type | Required | Example |
|----------|------|----------|---------|
| id | string | Yes | 'shoes' |
| name | string | Yes | 'Shoes' |
| icon | string | Yes | 'fa-solid fa-shoe-prints' |
| color | string | Yes | '#2563eb' |
| path | string | Yes | 'shop.html?category=shoes' |
| count | number | No | 245 |

---

## 🎨 Font Awesome Icons Reference

Common icons for categories:

| Category | Icon | Code |
|----------|------|------|
| Shoes | 👟 | `fa-solid fa-shoe-prints` |
| Clothing | 👔 | `fa-solid fa-shirt` |
| Bags | 👜 | `fa-solid fa-bag-shopping` |
| Watches | ⌚ | `fa-solid fa-watch` |
| Phones | 📱 | `fa-solid fa-mobile` |
| Accessories | 💍 | `fa-solid fa-ring` |
| Electronics | 💻 | `fa-solid fa-laptop` |
| Tools | 🔧 | `fa-solid fa-screwdriver-wrench` |
| Home | 🏠 | `fa-solid fa-house` |
| Sports | 🏋️ | `fa-solid fa-dumbbell` |
| Beauty | ✨ | `fa-solid fa-sparkles` |
| Books | 📚 | `fa-solid fa-book` |

More icons: https://fontawesome.com/search

---

## 🎨 Color Suggestions

| Color | Hex | Usage |
|-------|-----|-------|
| Blue | #2563eb | Primary brand |
| Purple | #7c3aed | Accessories |
| Pink | #ec4899 | Fashion |
| Orange | #f59e0b | Warmth |
| Teal | #06b6d4 | Tech |
| Red | #ef4444 | Energy |
| Green | #10b981 | Growth |

---

## ⚡ Performance Tips

1. **Lazy Load Images** - If using images instead of icons:
   ```html
   <img src="icon.png" alt="Category" loading="lazy">
   ```

2. **Debounce Resize** - Already done in the code

3. **Use requestAnimationFrame** - For smooth animations

4. **Minimize Repaints** - Avoid changing styles frequently

5. **Cache DOM Queries** - Store element references

6. **Use CSS for Animations** - Not JavaScript

---

## 🐛 Common Issues & Fixes

### Issue: Modal doesn't open
**Solution:** Check if `window.categoriesInstance` exists
```javascript
console.log(window.categoriesInstance); // Should exist
```

### Issue: Icons not showing
**Solution:** Ensure Font Awesome CSS is loaded
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
```

### Issue: Animations are laggy
**Solution:** Check browser console for heavy JavaScript
```javascript
// Check performance
console.time('categories');
window.categoriesInstance.open();
console.timeEnd('categories');
```

### Issue: Categories not appearing in navigation
**Solution:** Ensure mobile-nav.js is loaded before categories.js

---

## 📱 Testing on Devices

### Test on Different Screen Sizes
```javascript
// Check viewport size
console.log(window.innerWidth + 'x' + window.innerHeight);
```

### Test Touch Events
```javascript
// In DevTools console:
const card = document.querySelector('.category-card');
card.dispatchEvent(new TouchEvent('touchstart'));
```

### Test on Real Device
1. Run local server: `python -m http.server 8000`
2. Get your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Visit: `http://YOUR_IP:8000` on mobile device

---

## 📊 Analytics Events

The component automatically tracks:

| Event | Data | When |
|-------|------|------|
| categories_opened | - | Modal opened |
| categories_closed | - | Modal closed |

### Custom Analytics Integration
```javascript
// In your analytics script:
window.addEventListener('categoriesOpened', () => {
  // Track event
  ga('send', 'event', 'Categories', 'opened');
});
```

---

## 🔐 Security Notes

- All URLs are user-defined, so validate them
- No XSS vulnerabilities (no innerHTML of external content)
- No CSRF tokens needed (navigation only)
- Safe for production use

---

## 🎯 Best Practices

✅ **Do:**
- Update categories when backend data changes
- Monitor analytics events
- Test on real mobile devices
- Keep category names short (2 words max)
- Use consistent icon styles
- Provide meaningful product counts

❌ **Don't:**
- Add too many categories (keep to 12-15 max)
- Use very long category names
- Change colors randomly
- Disable accessibility features
- Block the modal from closing
- Make category navigation complex

---

## 📞 Need Help?

1. Check `CATEGORIES_INTEGRATION_GUIDE.md` for detailed docs
2. Review `CATEGORIES_EXAMPLE.html` for full example
3. Check browser console for errors
4. Test in DevTools mobile view first
5. Ensure all files are in correct paths

---

## 🔄 Version Info

- **Version:** 1.0
- **Last Updated:** January 9, 2026
- **Browser Support:** iOS 12+, Android Chrome 60+
- **Dependencies:** Font Awesome 6.5.0 (icons only)

---

**Ready to go!** 🚀
