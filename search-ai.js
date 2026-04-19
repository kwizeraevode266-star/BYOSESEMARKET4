(function () {
  const utils = window.ByoseSearchUtils;

  const COLOR_PALETTE = [
    { name: 'black', rgb: [32, 35, 41] },
    { name: 'white', rgb: [243, 244, 246] },
    { name: 'gray', rgb: [130, 136, 144] },
    { name: 'red', rgb: [194, 50, 61] },
    { name: 'orange', rgb: [226, 129, 45] },
    { name: 'yellow', rgb: [219, 188, 64] },
    { name: 'green', rgb: [54, 144, 84] },
    { name: 'blue', rgb: [59, 108, 187] },
    { name: 'purple', rgb: [122, 90, 176] },
    { name: 'pink', rgb: [212, 122, 151] },
    { name: 'brown', rgb: [122, 82, 52] },
    { name: 'beige', rgb: [207, 188, 152] }
  ];

  const OBJECT_RULES = [
    { token: 'shoes', match: /shoe|sneaker|trainer|boot|footwear|inkweto/ },
    { token: 'bag', match: /bag|handbag|backpack|purse|sac|leather/ },
    { token: 'watch', match: /watch|smartwatch|clock|amasaha|montre/ },
    { token: 'tv', match: /tv|television|monitor|screen|display/ },
    { token: 'phone', match: /phone|iphone|android|smartphone|mobile|cellphone/ },
    { token: 'shirt', match: /shirt|tshirt|tee|clothes|fashion|imyenda/ }
  ];

  const STYLE_RULES = [
    { token: 'sport', match: /sport|sports|running|trainer|sneaker|elite|pro|adidas|adidos/ },
    { token: 'classic', match: /classic|formal|timeless|leather/ },
    { token: 'casual', match: /casual|daily|shirt|tshirt|fashion/ },
    { token: 'smart', match: /smart|digital|android|tech|modern|electronics/ },
    { token: 'leather', match: /leather/ }
  ];

  const CATEGORY_DEFAULTS = {
    shoes: ['shoes', 'sport', 'casual'],
    electronics: ['watch', 'tv', 'phone', 'smart'],
    fashion: ['bag', 'shirt', 'casual', 'classic']
  };

  const profileCache = new Map();
  const imagePaletteCache = new Map();

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function rgbDistance(left, right) {
    return Math.sqrt(
      Math.pow((left[0] || 0) - (right[0] || 0), 2)
      + Math.pow((left[1] || 0) - (right[1] || 0), 2)
      + Math.pow((left[2] || 0) - (right[2] || 0), 2)
    );
  }

  function getNearestColor(rgb) {
    return COLOR_PALETTE.reduce((closest, candidate) => {
      const distance = rgbDistance(candidate.rgb, rgb);
      if (!closest || distance < closest.distance) {
        return { name: candidate.name, rgb: candidate.rgb, distance };
      }
      return closest;
    }, null);
  }

  function buildPaletteFromImage(image) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      return [];
    }

    const size = 48;
    canvas.width = size;
    canvas.height = size;
    context.drawImage(image, 0, 0, size, size);

    const { data } = context.getImageData(0, 0, size, size);
    const buckets = new Map();

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      if (alpha < 128) {
        continue;
      }

      const red = Math.round(data[index] / 32) * 32;
      const green = Math.round(data[index + 1] / 32) * 32;
      const blue = Math.round(data[index + 2] / 32) * 32;
      const key = `${red},${green},${blue}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    const total = Array.from(buckets.values()).reduce((sum, count) => sum + count, 0) || 1;

    return Array.from(buckets.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([key, count]) => {
        const rgb = key.split(',').map(Number);
        const nearest = getNearestColor(rgb);
        return {
          rgb,
          name: nearest ? nearest.name : 'neutral',
          prominence: count / total
        };
      });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.loading = 'eager';
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      image.src = src;
    });
  }

  function getImagePalette(src) {
    if (!src) {
      return Promise.resolve([]);
    }

    if (!imagePaletteCache.has(src)) {
      imagePaletteCache.set(
        src,
        loadImage(src)
          .then(buildPaletteFromImage)
          .catch(() => [])
      );
    }

    return imagePaletteCache.get(src);
  }

  function inferObjects(tokens, category) {
    const joined = tokens.join(' ');
    const inferred = new Set();

    OBJECT_RULES.forEach((rule) => {
      if (rule.match.test(joined)) {
        inferred.add(rule.token);
      }
    });

    (CATEGORY_DEFAULTS[String(category || '').toLowerCase()] || []).forEach((token) => {
      if (OBJECT_RULES.some((rule) => rule.token === token)) {
        inferred.add(token);
      }
    });

    return Array.from(inferred);
  }

  function inferStyles(tokens, category) {
    const joined = tokens.join(' ');
    const inferred = new Set();

    STYLE_RULES.forEach((rule) => {
      if (rule.match.test(joined)) {
        inferred.add(rule.token);
      }
    });

    (CATEGORY_DEFAULTS[String(category || '').toLowerCase()] || []).forEach((token) => {
      if (STYLE_RULES.some((rule) => rule.token === token)) {
        inferred.add(token);
      }
    });

    return Array.from(inferred);
  }

  async function buildProductProfile(product) {
    const catalogProduct = product || {};
    const tokens = utils.expandTokens(utils.tokenize([
      catalogProduct.name,
      catalogProduct.category,
      Array.isArray(catalogProduct.keywords) ? catalogProduct.keywords.join(' ') : ''
    ].join(' ')));

    const colors = await getImagePalette(catalogProduct.image);

    return {
      product: catalogProduct,
      tokens,
      objects: inferObjects(tokens, catalogProduct.category),
      styles: inferStyles(tokens, catalogProduct.category),
      colors,
      primaryColor: colors[0] || null
    };
  }

  function getProfileCacheKey(products) {
    return (products || [])
      .map((product) => `${product.id}:${product.image || ''}:${product.name || ''}`)
      .join('|');
  }

  function getCatalogProfiles(products) {
    const catalog = utils.getCatalog(products);
    const cacheKey = getProfileCacheKey(catalog);

    if (!profileCache.has(cacheKey)) {
      profileCache.set(cacheKey, Promise.all(catalog.map(buildProductProfile)));
    }

    return profileCache.get(cacheKey);
  }

  function getIntentTokens(query) {
    const baseTokens = utils.tokenize(query);
    return Array.from(new Set(utils.expandTokens(baseTokens)));
  }

  function getOverlapScore(left, right, weight) {
    if (!left.length || !right.length) {
      return 0;
    }

    const rightSet = new Set(right);
    const matches = left.filter((token) => rightSet.has(token)).length;
    return matches * weight;
  }

  function getColorScore(analysis, profile) {
    const analysisColors = Array.isArray(analysis && analysis.colors) ? analysis.colors : [];
    const productColors = Array.isArray(profile && profile.colors) ? profile.colors : [];

    if (!analysisColors.length || !productColors.length) {
      return 0;
    }

    const sharedNames = new Set(productColors.map((entry) => entry.name));
    let score = 0;

    analysisColors.forEach((entry, index) => {
      if (sharedNames.has(entry.name)) {
        score += index === 0 ? 16 : 10;
      }
    });

    if (analysis.primaryColor && profile.primaryColor) {
      const distance = rgbDistance(analysis.primaryColor.rgb, profile.primaryColor.rgb);
      score += clamp(20 - distance / 8, 0, 20);
    }

    return score;
  }

  function buildReasons(profile, analysis, queryTokens) {
    const reasons = [];
    const product = profile.product;

    if (getOverlapScore(analysis.objects || [], profile.objects || [], 1) > 0) {
      reasons.push(`Object match: ${(analysis.objects || []).filter((token) => (profile.objects || []).includes(token)).join(', ')}`);
    }

    if (getOverlapScore(analysis.styles || [], profile.styles || [], 1) > 0) {
      reasons.push(`Style match: ${(analysis.styles || []).filter((token) => (profile.styles || []).includes(token)).join(', ')}`);
    }

    const sharedColors = (analysis.colors || [])
      .map((entry) => entry.name)
      .filter((name) => (profile.colors || []).some((color) => color.name === name));

    if (sharedColors.length) {
      reasons.push(`Color match: ${sharedColors.join(', ')}`);
    }

    if (queryTokens.length && utils.scoreProduct(product, queryTokens) > 0) {
      reasons.push(`Text match: ${queryTokens.join(', ')}`);
    }

    return reasons;
  }

  function scoreProfile(profile, analysis, queryTokens) {
    const visualTokens = Array.isArray(analysis && analysis.tokens) ? analysis.tokens : [];
    const product = profile.product;

    const tokenScore = utils.scoreProduct(product, visualTokens) * 1.15;
    const queryScore = queryTokens.length ? utils.scoreProduct(product, queryTokens) * 1.35 : 0;
    const objectScore = getOverlapScore(analysis.objects || [], profile.objects || [], 26);
    const styleScore = getOverlapScore(analysis.styles || [], profile.styles || [], 12);
    const patternScore = getOverlapScore(analysis.patterns || [], profile.styles || [], 4);
    const colorScore = getColorScore(analysis, profile);
    const labelScore = (analysis.labels || []).reduce((total, entry) => {
      const confidenceBoost = clamp(Number(entry.confidence || 0), 0, 1) * 12;
      return total + (utils.scoreProduct(product, utils.tokenize(entry.label)) > 0 ? confidenceBoost : 0);
    }, 0);

    return {
      product,
      score: tokenScore + queryScore + objectScore + styleScore + patternScore + colorScore + labelScore,
      reasons: buildReasons(profile, analysis, queryTokens)
    };
  }

  async function matchProductsByImage(options) {
    const analysis = options && options.analysis ? options.analysis : {};
    const products = options && Array.isArray(options.products) ? options.products : [];
    const limit = Number(options && options.limit) > 0 ? Number(options.limit) : products.length || 10;
    const queryTokens = getIntentTokens(options && options.query ? options.query : '');
    const profiles = await getCatalogProfiles(products);

    const ranked = profiles
      .map((profile) => scoreProfile(profile, analysis, queryTokens))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || String(left.product.name).localeCompare(String(right.product.name)));

    return {
      ranked,
      results: ranked.slice(0, limit).map((entry) => entry.product),
      related: ranked.slice(limit, limit + 4).map((entry) => entry.product)
    };
  }

  function getRelatedProducts(query, products, excludeIds, limit) {
    const blockedIds = new Set(excludeIds || []);
    const ranked = utils.rankProductsByTokens(utils.getCatalog(products), getIntentTokens(query));
    const filtered = ranked.filter((product) => !blockedIds.has(product.id));

    if (filtered.length >= (limit || 4)) {
      return filtered.slice(0, limit || 4);
    }

    return utils.uniqueBy(filtered.concat(utils.getCatalog(products)), (product) => product.id)
      .filter((product) => !blockedIds.has(product.id))
      .slice(0, limit || 4);
  }

  window.ByoseSearchAI = {
    getCatalogProfiles,
    getRelatedProducts,
    matchProductsByImage
  };
})();