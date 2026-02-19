# How to Add a New Holy Chip Product

## Quick Guide (2 Minutes)

### Step 1: Add Character Image
Place your new character PNG in the `characters/` folder:
```bash
cp ~/Downloads/Chip_100.png characters/
```

### Step 2: Run One Command
```bash
npm run add-product Chip_100
```

**That's it!** The script automatically:
- ✅ Creates mug product in Printify
- ✅ Uploads character + brand images
- ✅ Configures print areas with correct settings
- ✅ Waits for mockup generation (30 seconds)
- ✅ Downloads all 6 mockup angles
- ✅ Updates `product-data.json`
- ✅ Deploys to Vercel
- ✅ **Product is LIVE!**

---

## What Happens Behind the Scenes

### 1. Product Creation (`node create-single-mug.js`)
```javascript
// Creates product in Printify with:
{
  title: "Holy Chip - Chip_100 Mug",
  variants: [Black, Red, Navy] × [11oz, 15oz],
  print_areas: {
    position: "front",
    chip: { x: 0.30, scale: 0.55 },  // Left side
    brand: { x: 0.80, scale: 0.5 }   // Right side
  }
}
```

### 2. Mapping Update
Automatically updates `public/product-data.json`:
```json
{
  "mugs": {
    "products": [
      { "chip": "Chip_100", "productId": "..." }
    ]
  }
}
```

### 3. Mockup Download (`node fetch-all-mug-angles.js`)
Downloads 6 angles for the new mug:
- `Chip_100_mug_front.png`
- `Chip_100_mug_back.png`
- `Chip_100_mug_left.png`
- `Chip_100_mug_right.png`
- `Chip_100_mug_context1.png`
- `Chip_100_mug_context2.png`

### 4. Deployment
- Push updated `product-data.json` to GitHub
- GitHub Pages auto-deploys frontend
- New mockup images available
- **Live in ~30 seconds!**

---

## Manual Method (If You Prefer)

### Step 1: Create Product
```bash
node create-single-mug.js Chip_100
```

Wait 1-2 minutes for Printify to generate mockups.

### Step 2: Download Mockups
```bash
node fetch-all-mug-angles.js
```

### Step 3: Deploy
```bash
git add .
git commit -m "Add Chip_100 product"
git push origin main
```

---

## Adding T-Shirts (Coming Soon)

Once t-shirt rate limit clears, similar process:
```bash
npm run add-tshirt Chip_100
```

This will create both t-shirt styles for the character.

---

## File Locations

### Character Images
```
characters/
├── Chip_0.png
├── Chip_1.png
├── Chip_100.png  ← Add new characters here
└── ...
```

### Product Data (Auto-Updated)
```
public/product-data.json  ← Deployed with your site
mug-mapping.json          ← Backup/reference
```

### Mockup Images (Auto-Downloaded)
```
public/assets/mug-mockups/
├── Chip_0_mug_front.png
├── Chip_100_mug_front.png  ← Auto-downloaded
└── ...
```

---

## Verification Checklist

After adding a product, verify:

1. **Printify Dashboard**
   - Go to: https://printify.com/app/products
   - Find "Holy Chip - Chip_100 Mug"
   - Verify: Design shows Chip on left, Brand on right
   - Status: Published

2. **Local Files**
   - `public/product-data.json` updated ✓
   - `public/assets/mug-mockups/Chip_100_mug_*.png` exist ✓

3. **Live Site**
   - Go to: https://mell0dia.github.io/holy-chip-site/store.html
   - Click on "Chip_100" character
   - Verify: Mug product appears
   - Click image: Lightbox shows all 6 angles
   - Add to cart: Works correctly

4. **Test Checkout** (Optional)
   - Add product to cart
   - Go to checkout
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete purchase
   - Check Printify: Order created ✓

---

## Troubleshooting

### "Character image not found"
```bash
# Check if image exists:
ls characters/Chip_100.png

# If not, add it:
cp ~/path/to/Chip_100.png characters/
```

### "Product creation failed"
- Check Printify API token is valid
- Verify shop ID is correct (26508747)
- Check API rate limits (wait 5 minutes)

### "Mockups show blank mugs"
- Wait longer (Printify takes 30 min - 2 hours)
- Re-run: `node fetch-all-mug-angles.js`
- Check Printify dashboard to verify design exists

### "Product not showing on site"
- Verify `product-data.json` updated
- Check deployment was successful
- Clear browser cache
- Check browser console for errors

---

## Scaling to Hundreds of Characters

### Current System Handles:
- ✓ Unlimited characters
- ✓ No environment variable limits
- ✓ Fast product lookups
- ✓ Automatic deploys

### Performance Notes:
- **Adding 1 product**: ~2 minutes
- **Adding 10 products**: ~20 minutes (run sequentially)
- **Deploy time**: ~30 seconds (regardless of product count)
- **Site load time**: Fast (product data is ~10KB per 100 products)

### Future Optimizations (When You Hit 500+ Products):
1. **Batch product creation** (create 10 at once)
2. **Database migration** (for instant lookups)
3. **CDN for images** (faster mockup loading)
4. **Background job queue** (add products async)

But for now, **Option 3 is perfect** for your scale!

---

## Cost Breakdown (Per New Product)

**Fixed Costs:**
- Printify product creation: $0
- Vercel deployment: $0 (free tier)
- Storage: $0 (within limits)

**Variable Costs (When Sold):**
- Printify wholesale: ~$8 per mug
- Stripe fees: 2.9% + $0.30
- **Your profit**: $15 - $8 - fees = ~$6.50 per mug

---

## Summary

**Adding a new product is now:**
1. Add PNG to `characters/` folder
2. Run `npm run add-product Chip_100`
3. Wait 2 minutes
4. **Product is live!**

**No manual steps. No environment variables. Just works.** ✨

---

## Next Steps

Ready to add your first new product? Follow the Quick Guide at the top!

**Example:**
```bash
# Add your new character image
cp ~/Downloads/Chip_200.png characters/

# Run the automated script
npm run add-product Chip_200

# Wait 2 minutes, then deploy
git add .
git commit -m "Add Chip_200"
git push origin main

# ✅ Done! Check https://mell0dia.github.io/holy-chip-site/store.html
```
