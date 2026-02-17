# Holy Chip Product Automation Guide

## Quick Start - Adding a New Character

**Step 1:** Add character image
- Place new character PNG in `characters/` folder
- Name format: `Chip_X.png` (e.g., `Chip_10.png`, `Chip_1110.png`)

**Step 2:** Create products
```bash
# For a single new character:
node create-single-product.js Chip_10

# Or recreate all products:
node recreate-all-mugs-final.js
node create-all-products.js  # For t-shirts
```

**Step 3:** Wait for mockups (30min - 2 hours)

**Step 4:** Download mockup images
```bash
node fetch-all-mug-angles.js     # Downloads 6 angles per mug
node fetch-all-mockups.js        # Downloads t-shirt mockups
```

---

## Key Settings (TESTED AND VERIFIED)

### Mug Products
**Blueprint ID:** 635 (Accent Mug)
**Print Provider:** District Photo
**Variants:** Black, Red, Navy × 11oz, 15oz (6 total)
**Price:** $15.00

**Critical Print Area Settings:**
```javascript
{
  position: "front",  // MUST be "front" for mugs, NOT "default"
  images: [
    {
      id: chipImageId,
      x: 0.30,      // 30% from left
      y: 0.5,       // Centered vertically
      scale: 0.55,  // 55% size
      angle: 0
    },
    {
      id: brandImageId,
      x: 0.80,      // 80% from left (20% from right)
      y: 0.5,       // Centered vertically
      scale: 0.5,   // 50% size
      angle: 0
    }
  ]
}
```

**Why these settings:**
- `position: "front"` - Required for mugs to accept images
- Chip at 30%, Brand at 80% - Prevents overlap
- scale 0.55 and 0.5 - Tested sizing for visual balance

### T-Shirt Products
**Blueprints:**
- Style 3 (Front: Chip, Back: Brand) - Blueprint 6
- Style 4 (Front: Chip + Brand) - Blueprint 6

**Variants:** White only (optimized for mockups)
**Prices:** Style 3 = $25, Style 4 = $25

**Print Areas:**
- Front: x=0.5, y=0.45, scale=1.0
- Back: x=0.5, y=0.40, scale=1.0

---

## File Structure

```
holy-chip-site/
├── characters/              # All character images
│   ├── Chip_0.png
│   ├── Chip_1.png
│   └── ...
├── assets/
│   ├── brand.png           # Holy Chip branding (reused)
│   └── mug-mockups/        # Downloaded mockup images
├── printify-config.js      # API credentials
├── mug-mapping.json        # Maps chips to mug product IDs
├── product-mapping.json    # Maps chips to t-shirt product IDs
└── AUTOMATION SCRIPTS:
    ├── recreate-all-mugs-final.js       # Create all mugs
    ├── create-all-products.js           # Create all t-shirts
    ├── fetch-all-mug-angles.js          # Download mug mockups
    └── fetch-all-mockups.js             # Download t-shirt mockups
```

---

## Troubleshooting

### Problem: Images don't appear on Printify
**Solution:** Make sure `position: "front"` is used for mugs (not "default")

### Problem: Images overlap on mugs
**Solution:** Use tested settings: Chip(x=0.30, scale=0.55), Brand(x=0.80, scale=0.5)

### Problem: "Product is disabled for editing"
**Solution:** Can't update products via API immediately after creation. Must create products with correct settings from the start.

### Problem: No mockup images available
**Solution:** Printify generates mockups 30min - 2 hours after product creation. Wait, then re-run download script.

---

## API Flow

### Creating a Mug Product
1. Upload Chip image → Get `chipImageId`
2. Upload Brand image → Get `brandImageId` (or reuse existing)
3. Get print providers for blueprint 635
4. Get variants for print provider
5. Filter variants (Black, Red, Navy)
6. Create product with:
   - Title, description, price
   - Filtered variants
   - **Print areas with position="front" and tested x/y/scale values**

### Why We Tested Everything
- Initially used `position: "default"` → Images didn't appear
- Changed to `position: "front"` → Images appeared but overlapped
- Adjusted x positions (0.35→0.30, 0.65→0.70→0.80) → Still overlapping
- Adjusted scale (Chip: 0.8→0.7→0.55, Brand: 0.6→0.5) → **Perfect!**

---

## Future Enhancements

To add a new product type:
1. Find blueprint ID on Printify
2. Test with one product to find correct:
   - `position` value
   - `x`, `y`, `scale` values
3. Document settings here
4. Create automation script

---

## Quick Reference

**Add new character:**
```bash
# 1. Add Chip_X.png to characters/
# 2. Run automation
node recreate-all-mugs-final.js

# 3. Wait 1-2 hours
# 4. Download mockups
node fetch-all-mug-angles.js
```

**Check product on Printify:**
- Dashboard → Products → Find by title "Holy Chip - Chip_X Mug"
- Should show Chip on left, Brand on right, no overlap

**Verify automation worked:**
- Check `mug-mapping.json` for new product ID
- Open product on Printify to see images
- Wait for mockups, then download
