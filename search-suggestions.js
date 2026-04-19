(function () {
  const utils = window.ByoseSearchUtils;

  function collectSuggestionPool(products) {
    const phrases = [];

    products.forEach((product) => {
      phrases.push({ label: product.name, meta: 'Product', source: product.name });
      phrases.push({ label: product.category, meta: 'Category', source: product.category });

      product.keywords.forEach((keyword) => {
        phrases.push({ label: keyword, meta: 'Keyword', source: keyword });
      });
    });

    return utils.uniqueBy(
      phrases.filter((item) => utils.normalizeText(item.label)),
      (item) => utils.normalizeText(item.label)
    );
  }

  function scoreSuggestion(item, query) {
    const normalizedLabel = utils.normalizeText(item.label);
    if (!normalizedLabel) {
      return 0;
    }
    if (normalizedLabel === query) {
      return 100;
    }
    if (normalizedLabel.startsWith(query)) {
      return 80;
    }
    if (normalizedLabel.includes(query)) {
      return 45;
    }
    return 0;
  }

  function createEngine(products) {
    const suggestionPool = collectSuggestionPool(products);

    function getSuggestions(query, limit) {
      const normalizedQuery = utils.normalizeText(query);

      if (!normalizedQuery) {
        return suggestionPool.slice(0, limit || 6);
      }

      return suggestionPool
        .map((item) => ({ ...item, score: scoreSuggestion(item, normalizedQuery) }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
        .slice(0, limit || 6);
    }

    return { getSuggestions };
  }

  window.ByoseSearchSuggestions = { createEngine };
})();