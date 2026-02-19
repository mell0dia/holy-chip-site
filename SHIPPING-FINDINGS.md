# Shipping Cost Analysis - Holy Chip Store

## Date: 2026-02-18

## Finding: SwiftPOD Charges Per Product Type

### Background
Migrated all mugs from District Photo → SwiftPOD to achieve "unified shipping" and reduce costs. All products now use SwiftPOD (provider 39).

### Test Results (Shipping to Canada)

| Configuration | Shipping Cost |
|--------------|---------------|
| 1 T-Shirt only | $9.39 |
| 3 T-Shirts only | $18.17 |
| 1 Mug only | $14.89 |
| 2 Mugs only | $20.98 |
| 1 T-Shirt + 1 Mug | $24.28 |
| **3 T-Shirts + 1 Mug** | **$33.06** |

### Analysis

The shipping costs for mixed orders are **additive**:
- $18.17 (3 t-shirts) + $14.89 (1 mug) = $33.06 ✓

**Conclusion:** Even though all products are from the same provider (SwiftPOD), Printify charges shipping separately for different product categories. They treat t-shirts and mugs as separate shipments.

### Before Migration
- SwiftPOD T-Shirts + Printify Choice Mugs = $33.06
  - SwiftPOD: $18.17
  - Printify Choice: $14.89

### After Migration
- All SwiftPOD (T-Shirts + Mugs) = $33.06
  - T-Shirts: $18.17
  - Mugs: $14.89

**Result: No savings from provider consolidation**

### Why This Happens
Printify's shipping calculation is based on:
1. **Product Type** (Blueprint): T-Shirts vs Mugs are different blueprints
2. **Fulfillment Process**: Different product types may ship from different facilities or require different packaging, even from same provider

### Options Moving Forward

1. **Accept Current Costs**
   - Pros: Products are high quality, reliable provider
   - Cons: No shipping savings achieved

2. **Free Shipping Threshold**
   - Offer free shipping on orders over $X (e.g., $100)
   - Build shipping cost into product pricing

3. **Flat Rate Shipping**
   - Charge $35 flat rate for all orders
   - Simpler for customers, predictable costs

4. **Volume Discounts**
   - Encourage larger orders to offset per-item shipping
   - "Buy 5+ items, get 15% off"

5. **Mug-Only or Shirt-Only Bundles**
   - Create product bundles to avoid mixed-type orders
   - Better shipping economics for single-type orders

### Recommendation
Consider implementing a free shipping threshold or flat rate to make costs more predictable and competitive. The current POD model's shipping structure won't improve further with provider consolidation.
