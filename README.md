# Holy Chip - Product Automation

## Quick Start - Add New Character

**1. Add character image:**
```bash
# Place new PNG in characters/ folder
characters/Chip_10.png
```

**2. Create mug product:**
```bash
node create-single-mug.js Chip_10
```

**3. Wait 1-2 hours for Printify to generate mockups**

**4. Download mockup images:**
```bash
node fetch-all-mug-angles.js
```

Done! Your new character is now a product.

---

## All Commands

### Create Products
```bash
# Single mug
node create-single-mug.js Chip_X

# All mugs (recreate everything)
node recreate-all-mugs-final.js

# All t-shirts
node create-all-products.js
```

### Download Mockups
```bash
# Mug mockups (6 angles per mug)
node fetch-all-mug-angles.js

# T-shirt mockups (front + back)
node fetch-all-mockups.js
```

### Test/Check
```bash
# Test mug creation
node test-create-mug-correct.js

# Check product details
node check-mug-product.js
```

---

## Complete Documentation

See **[AUTOMATION-GUIDE.md](./AUTOMATION-GUIDE.md)** for:
- Detailed settings and why they work
- Troubleshooting guide
- File structure
- API flow explanation

---

## Product Settings (DO NOT CHANGE)

These settings were tested extensively:

**Mugs:**
- Position: "front"
- Chip: x=0.30, scale=0.55
- Brand: x=0.80, scale=0.5

**T-Shirts:**
- White variants only
- Front/Back or Front-only layouts
- Standard positioning
# Last updated: Wed Feb 18 00:50:17 PST 2026
