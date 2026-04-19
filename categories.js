/* categories.js
	 Dynamically renders category cards and handles interactions.
	 - Uses modern ES6
	 - Adds click/keyboard handlers to redirect to shop.html?category=slug
	 - Includes client-side search/filter
*/

const categories = [
	{ name: 'Shoes', slug: 'shoes', count: 124, image: 'https://images.unsplash.com/photo-1600180758890-6ffa1b3dfd30?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=1' },
	{ name: 'Bags', slug: 'bags', count: 88, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=2' },
	{ name: 'Clothes', slug: 'clothes', count: 320, image: 'https://images.unsplash.com/photo-1520975698517-2c3c3f8b2f12?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=3' },
	{ name: 'Electronics', slug: 'electronics', count: 212, image: 'https://images.unsplash.com/photo-1518779578993-ec3579fff3d1?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=4' },
	{ name: 'Smartphones', slug: 'smartphones', count: 154, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=5' },
	{ name: 'Accessories', slug: 'accessories', count: 96, image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=6' },
	{ name: 'Watches', slug: 'watches', count: 67, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7' },
	{ name: 'Beauty Products', slug: 'beauty-products', count: 140, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=8' },
	{ name: 'Home Items', slug: 'home-items', count: 185, image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=9' },
	{ name: 'Sports', slug: 'sports', count: 58, image: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=10' },
	{ name: 'Kids', slug: 'kids', count: 74, image: 'https://images.unsplash.com/photo-1542204165-3d1a47f38b35?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=11' },
	{ name: 'Gaming', slug: 'gaming', count: 43, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=12' }
];

const grid = document.getElementById('categoriesGrid');
const searchInput = document.getElementById('categorySearch');

/** createCard - builds DOM for a single category */
const createCard = (cat, index) => {
	const card = document.createElement('article');
	card.className = 'category-card animate';
	card.setAttribute('role', 'button');
	card.setAttribute('tabindex', '0');
	card.setAttribute('aria-label', `${cat.name} category with ${cat.count} products`);

	// Set staggered animation delay for nice entrance
	card.style.animationDelay = `${index * 60}ms`;

	card.innerHTML = `
		<div class="category-media">
			<img src="${cat.image}" alt="${cat.name}" loading="lazy">
		</div>
		<div class="category-content">
			<h3 class="category-title">${cat.name}</h3>
			<div class="category-count">${cat.count} Products</div>
		</div>
		<div class="category-overlay"></div>
		<div class="category-badge">${cat.count}</div>
	`;

	// click handler - navigate with category query param
	const navigate = () => {
		const q = encodeURIComponent(cat.slug);
		window.location.href = `shop.html?category=${q}`;
	};

	card.addEventListener('click', navigate);
	card.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
	});

	return card;
};

/** render - places category cards in the grid */
const render = (items) => {
	grid.innerHTML = '';
	items.forEach((c, i) => grid.appendChild(createCard(c, i)));
};

// initial render
render(categories);

// set current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// search/filter behavior
if (searchInput) {
	searchInput.addEventListener('input', (e) => {
		const q = e.target.value.trim().toLowerCase();
		if (!q) { render(categories); return; }
		const filtered = categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
		render(filtered);
	});
}

// Expose for potential future use (e.g., dynamic loading)
window.appCategories = {
	categories,
	render
};

