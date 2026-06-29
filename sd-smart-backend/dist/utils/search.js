"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchProduct = matchProduct;
/**
 * Utility function to match a product against a search query string.
 * Normalizes query into lowercased terms and checks if ALL terms match
 * at least one field (including name, description, category, specs, variantDetails, prices, etc.).
 *
 * @param product The product object
 * @param query The search query string
 * @returns boolean indicating if the product matches the query
 */
function matchProduct(product, query) {
    if (!query || !query.trim())
        return true;
    // Split query into individual lowercase terms
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.trim() !== "");
    if (terms.length === 0)
        return true;
    // Compile all searchable texts/data from the product
    const searchableTexts = [];
    // 1. Text Fields
    if (product.name)
        searchableTexts.push(product.name.toLowerCase());
    if (product.category)
        searchableTexts.push(product.category.toLowerCase());
    if (product.categoryLabel)
        searchableTexts.push(product.categoryLabel.toLowerCase());
    if (product.modelNumber)
        searchableTexts.push(product.modelNumber.toLowerCase());
    if (product.sku)
        searchableTexts.push(product.sku.toLowerCase());
    if (product.productId)
        searchableTexts.push(product.productId.toLowerCase());
    if (product.badge)
        searchableTexts.push(product.badge.toLowerCase());
    if (product.eyebrow)
        searchableTexts.push(product.eyebrow.toLowerCase());
    if (product.description)
        searchableTexts.push(product.description.toLowerCase());
    if (product.productDescription)
        searchableTexts.push(product.productDescription.toLowerCase());
    if (product.warranty)
        searchableTexts.push(product.warranty.toLowerCase());
    if (product.href)
        searchableTexts.push(product.href.toLowerCase());
    // 2. Numeric Price Fields
    if (product.price !== undefined && product.price !== null) {
        searchableTexts.push(String(product.price));
    }
    if (product.originalPrice !== undefined && product.originalPrice !== null) {
        searchableTexts.push(String(product.originalPrice));
    }
    if (product.startingPrice !== undefined && product.startingPrice !== null) {
        searchableTexts.push(String(product.startingPrice));
    }
    // 3. JSON Specs array (e.g. [{"label": "Capacity", "value": "5 Liters"}])
    if (product.specs) {
        try {
            const specsArr = typeof product.specs === "string" ? JSON.parse(product.specs) : product.specs;
            if (Array.isArray(specsArr)) {
                specsArr.forEach((spec) => {
                    if (spec.label)
                        searchableTexts.push(spec.label.toLowerCase());
                    if (spec.value)
                        searchableTexts.push(spec.value.toLowerCase());
                });
            }
        }
        catch (e) {
            searchableTexts.push(String(product.specs).toLowerCase());
        }
    }
    // 4. JSON variantDetails (e.g. {"Capacity": "5 Liters"})
    if (product.variantDetails) {
        try {
            const details = typeof product.variantDetails === "string" ? JSON.parse(product.variantDetails) : product.variantDetails;
            if (details && typeof details === "object") {
                Object.entries(details).forEach(([key, val]) => {
                    searchableTexts.push(key.toLowerCase());
                    searchableTexts.push(String(val).toLowerCase());
                });
            }
        }
        catch (e) {
            searchableTexts.push(String(product.variantDetails).toLowerCase());
        }
    }
    // Check if ALL terms match at least one searchable text field
    return terms.every((term) => {
        // Strip common currency prefixes like rs. or ₹ for pure number comparison
        const cleanTerm = term.replace(/^(rs\.?|₹|inr)/i, "").trim();
        if (cleanTerm === "")
            return false;
        return searchableTexts.some((text) => text.includes(cleanTerm));
    });
}
