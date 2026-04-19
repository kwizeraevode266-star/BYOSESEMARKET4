# 🎨 PRODUCT CARD REDESIGN - VISUAL REFERENCE

## Modern Premium Product Card Design

```
┌─────────────────────────────────────┐
│  [PRODUCT MEDIA SECTION]            │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │    [PRODUCT IMAGE]     ┌────┐ │  │ ← 240px height (desktop)
│  │                        │-25%│ │  │   Discount badge (top-right)
│  │                        └────┘ │  │
│  │                               │  │
│  │  ON HOVER:                    │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Semi-transparent overlay│  │  │
│  │  │   with blur effect      │  │  │
│  │  │                         │  │  │
│  │  │   [❤️] [👁️]           │  │  │
│  │  │ Wishlist  Quick View    │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│ FOOTWEAR                            │ ← Category badge
│                                     │
│ Premium Aero Running Shoes          │ ← Product title (2-line max)
│                                     │
│ ★★★★☆ 4.5                          │ ← Star rating + value
│                                     │
│ Lightweight shoes with breathable   │ ← Description (2-line max)
│ mesh and responsive cushioning.     │
├─────────────────────────────────────┤
│ ₱21,499  ₱15,000                    │ ← Old price (strikethrough)
│                                     │   Current price (bold, green)
├─────────────────────────────────────┤
│        🛒  ADD TO CART              │ ← Full-width action button
└─────────────────────────────────────┘

HOVER STATE:
├─────────────────────────────────────┤
│                                     │
│    Card lifts 6px up ⬆️              │
│    Shadow becomes deeper            │
│    Image zooms 1.06x               │
│    Title changes to green          │
│    Button has glow effect          │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 Color & Typography

### Text Hierarchy
```
Product Title:        1.05rem, 600 weight, dark → hover: green
Category:             0.7rem, 700 weight, uppercase, green bg
Description:          0.85rem, 400 weight, muted gray
Price:                1.5rem, 700 weight, green
Old Price:            0.9rem, 400 weight, strikethrough gray
Rating:               0.85rem stars + 0.8rem value
```

### Color Values
```
Primary Green:    #00B894  (call-to-action)
Discount Red:     #FF6B35  (urgency)
Text Dark:        #0f172a  (readability)
Text Muted:       #64748b  (secondary info)
Border Light:     #e5e7eb  (subtle dividers)
Background:       #f6f7fb  (soft white)
Card:             #ffffff  (pure white)
```

---

## 📱 Responsive Variations

### Desktop (4 Columns)
```
Width: 1200px+
Columns: 4
Gap: 20px
Image Height: 240px
Card Height: ~420px (auto)
Button: Full width with text
```

### Tablet (3 Columns)
```
Width: 1024px - 768px
Columns: 3
Gap: 18px
Image Height: 220px
Card Height: ~380px (auto)
Button: Full width with text
```

### Mobile (2 Columns)
```
Width: 768px - 640px
Columns: 2
Gap: 14px
Image Height: 200px
Card Height: ~360px (auto)
Button: Full width with text
```

### Small Mobile (2 Columns Compact)
```
Width: 640px - 480px
Columns: 2
Gap: 12px
Image Height: 180px
Card Height: ~320px (auto)
Button: Icon only (text hidden)
Category: Hidden
```

### Extra Small (2 Columns Ultra-Compact)
```
Width: < 480px
Columns: 2
Gap: 10px
Image Height: 160px
Card Height: ~300px (auto)
Button: Icon only
Description: 1-line clamp
Category: Hidden
```

---

## ✨ Hover & Interactive States

### Card Hover
```
┌─ Transform: translateY(-6px)
├─ Box Shadow: 0 20px 50px rgba(...)
├─ Border: slight color change
└─ Transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Image Hover
```
├─ Transform: scale(1.06)
├─ Transition: 0.4s smooth zoom
└─ Creates visual feedback without jumpiness
```

### Overlay Buttons (On Hover)
```
┌─ Opacity: 0 → 1
├─ Backdrop: blur(2px)
├─ Background: rgba(0,0,0,0.5) semi-transparent
├─ Buttons: ❤️ Wishlist + 👁️ Quick View
└─ Transition: 0.3s ease
```

### Button States
```
Normal:     #00B894 green, 11px padding
Hover:      #00a07a darker green, -2px Y offset, glow shadow
Active:     Back to 0px Y offset
Disabled:   0.6 opacity, no transform
Wishlist:   Red background when active/liked
```

---

## 🏗️ Card Structure (HTML)

```html
<article class="product-card" data-id="1">
  
  <!-- IMAGE SECTION -->
  <div class="product-media">
    <!-- Discount Badge (if oldPrice exists) -->
    <div class="product-badge product-badge--discount">-25%</div>
    
    <!-- Product Image -->
    <img src="..." alt="..." class="product-image" loading="lazy" />
    
    <!-- Hover Overlay (appears on hover) -->
    <div class="product-overlay">
      <button class="product-overlay-btn product-overlay-btn--wishlist">❤️</button>
      <button class="product-overlay-btn product-overlay-btn--quick-view">👁️</button>
    </div>
  </div>
  
  <!-- CONTENT SECTION -->
  <div class="product-body">
    
    <!-- Category Badge -->
    <span class="product-category">FOOTWEAR</span>
    
    <!-- Product Title -->
    <h3 class="product-title">Premium Running Shoes</h3>
    
    <!-- Star Rating -->
    <div class="product-rating">
      <span class="product-rating-stars">★★★★☆</span>
      <span class="product-rating-value">4.5</span>
    </div>
    
    <!-- Description -->
    <p class="product-desc">Lightweight shoes with breathable mesh...</p>
    
    <!-- Price Section -->
    <div class="product-price-section">
      <span class="product-price-original">₱21,499</span>
      <div class="product-price">₱15,000</div>
    </div>
    
    <!-- Actions -->
    <div class="product-actions">
      <button class="add-btn" data-id="1">
        <i class="fa-solid fa-shopping-cart"></i>
        <span>Add to Cart</span>
      </button>
    </div>
  </div>
  
</article>
```

---

## 🎨 Shadow & Depth System

### Shadows
```
--shadow:      0 10px 30px rgba(2, 6, 23, 0.06)    /* Subtle */
--shadow-md:   0 20px 50px rgba(2, 6, 23, 0.1)     /* Hover */
--shadow-lg:   0 25px 60px rgba(2, 6, 23, 0.15)    /* Modal */
```

### Border Radius
```
--radius:      14px   /* Cards, inputs, large elements */
--radius-sm:   8px    /* Buttons, smaller elements */
```

---

## 📊 Spacing & Gaps

### Card Internal Spacing
```
Card padding:           14px - 16px
Content gap:            8px - 12px
Price section margin:   8px top/bottom
Border thickness:       1px (subtle)
Title min-height:       2.8em (2-line guarantee)
Description min-height: 2.55em (2-line guarantee)
```

### Grid Spacing
```
Desktop gap:   20px (balanced luxury feel)
Tablet gap:    18px (slightly tighter)
Mobile gap:    14px - 12px (compact mobile experience)
```

---

## 🔄 Discount Badge Animation

```css
@keyframes badgePulse {
  0%:     scale(1)
  50%:    scale(1.05)
  100%:   scale(1)
  Duration: 2s infinite
}
```

Effect: Subtle pulse draw attention to discount without being aggressive

---

## 🌟 Star Rating System

### Display Format
```
★★★★★ = 5 stars (excellent)
★★★★☆ = 4 stars (very good)
★★★☆☆ = 3 stars (good)
★★☆☆☆ = 2 stars (fair)
★☆☆☆☆ = 1 star (poor)
```

### Implementation
- Uses Unicode star characters (★ ☆)
- Yellow color: #ffc107
- Shows numeric value alongside (e.g., "4.5")
- Defaults to random 1-5 if not provided

---

## 🎯 Responsive Breakpoints

```
Desktop (1200px+)    → 4 columns, full size
Tablet (1024px)      → 3 columns, medium
Medium (768px)       → 2 columns, medium-small
Mobile (640px)       → 2 columns, small
Small (480px)        → 2 columns, compact
Extra Small (380px)  → 2 columns, ultra-compact
```

---

## ✅ Accessibility Features

- ARIA labels on all buttons
- Semantic HTML structure
- Keyboard navigation support
- Color contrast compliant (WCAG AA)
- Readable font sizes (min 12px)
- Clear focus states (2px outline)
- Proper heading hierarchy

---

*Professional E-Commerce Product Card Design*
*Modern, Clean, Fast, Accessible*
