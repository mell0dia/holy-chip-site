# BACKLOG.md - Holy Chip Future Tasks

_Things to build, improve, and explore._

## 🔥 High Priority

- [ ] **Filter Product Display to White Shirts Only**
  - Printify mockups include multiple colors (35 images per product)
  - Update store-v2.html to show ONLY white t-shirt mockups
  - Identify which mockup image index corresponds to white shirts
  - Filter out all other colors for now

- [ ] **Show Front AND Back Views in Product Cards**
  - Currently each product card shows only 1 image (front view)
  - Update product cards to display BOTH front and back views side-by-side
  - Front view: Shows the Chip design
  - Back view: Shows the brand logo (Style #3) or empty (Style #5)
  - Create responsive layout for dual-image display

- [ ] **CREATE ALL T-SHIRT PRODUCTS (24 total)**
  - Run automation to create all 12 Chips × 2 styles = 24 t-shirt products
  - Style #3: Front: Chip | Back: Brand (50% top)
  - Style #5: Front: Brand (80% top) + Chip (80% bottom)
  - Currently only 5 test products exist
  - Script ready: Need to customize create-products.js for both styles

- [ ] **Integrate Printify Checkout**
  - Replace placeholder checkout in store-v2.html
  - Send cart items to Printify API for actual purchase
  - Test end-to-end purchase flow with real products

## Store - Products

- [ ] **Design & Create Mug Products (12 total)**
  - Test design layouts for mugs
  - Decide on Chip + brand positioning
  - Create all 12 mug products via automation

- [ ] **Design & Create Hat Products (12 total)**
  - Test design layouts for hats
  - Decide on Chip + brand positioning
  - Create all 12 hat products via automation

## Store Improvements

- [ ] **Replace product type buttons with Printify template images** - Instead of simple "T-shirt/Mug/Hat" buttons, use actual product template images from Printify API to show what products look like

## Features to Add

- [ ] _[Future items will be added here]_

## Integrations

- [ ] **NFT Marketplace Integration** - Link NFT section to chosen marketplace

## Content

- [ ] _[Future content tasks]_

## Design Polish

- [ ] _[Future design improvements]_

---

**Last Updated:** 2026-02-13

_Add new items as we discover what needs to be built. Check off items as completed._
