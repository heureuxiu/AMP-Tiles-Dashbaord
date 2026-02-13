# Database Seeding Guide

## Seed Sample Data

### 1. Seed Admin User (if not already done)
```bash
npm run seed:admin
```

**Admin Credentials:**
- Email: `admin@amptiles.com.au`
- Password: `admin@amptiles.com.au`

⚠️ **Important:** Change the password after first login!

### 2. Seed Sample Products
```bash
npm run seed:products
```

This will create sample products for all categories:
- Royal Series
- Sivno Series
- Tile
- Artic Series
- Builders range
- Galaxy Series
- Marella Series
- Iron Series
- Lavic Series
- Onyx Series
- River Series
- Iris Series
- Kaira Series
- Lemo Series

**Finishes included:**
- Matt
- Polished
- Gloss

### 3. Dynamic Filters

The category and finish filters are now **dynamic** and will automatically update when:
- New products with new categories are added
- New products with new finishes are added

When adding a new product:
1. You can select from existing categories/finishes
2. OR type a new category/finish name to create it
3. A warning will show when creating a new category/finish

## Notes

- All categories and finishes are now stored in the database (no hardcoded values)
- Filters will automatically show all unique categories and finishes from your products
- No need to manually update filter options when adding new categories
