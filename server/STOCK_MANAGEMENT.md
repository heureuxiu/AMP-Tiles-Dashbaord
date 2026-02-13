# Stock Management System

Complete backend and frontend integration for inventory stock management.

## Features

✅ Real-time stock updates (Stock In / Stock Out)
✅ Stock transaction history tracking
✅ Product-wise stock history
✅ Stock statistics and analytics
✅ Remarks/notes for each transaction
✅ User tracking (who made the changes)

## Database Models

### StockTransaction Model
Tracks all stock movements with:
- Product reference
- Transaction type (stock-in / stock-out)
- Quantity
- Previous and new stock levels
- Remarks
- Created by user
- Timestamps

## API Endpoints

### Stock Statistics
```
GET /api/stock/stats
```
Returns overall stock statistics:
- Total products count
- Total stock quantity
- In stock items count
- Low stock items count
- Out of stock items count
- Recent transactions count (last 24 hours)

### Get All Transactions
```
GET /api/stock/transactions
```
Query parameters:
- `productId` - Filter by specific product
- `type` - Filter by type (stock-in or stock-out)
- `startDate` - Filter from date
- `endDate` - Filter to date
- `limit` - Number of results (default: 50)

### Get Single Transaction
```
GET /api/stock/transactions/:id
```
Returns detailed transaction information.

### Update Stock (Create Transaction)
```
POST /api/stock/update
```
Body:
```json
{
  "productId": "product_id_here",
  "type": "stock-in",  // or "stock-out"
  "quantity": 50,
  "remarks": "Optional notes about the transaction"
}
```

Response:
```json
{
  "success": true,
  "message": "Stock added successfully",
  "transaction": { /* transaction details */ },
  "product": {
    "_id": "product_id",
    "name": "Product Name",
    "sku": "SKU-123",
    "previousStock": 100,
    "newStock": 150
  }
}
```

### Get Product Stock History
```
GET /api/stock/history/:productId
```
Query parameters:
- `limit` - Number of records (default: 20)

Returns all stock transactions for a specific product.

## Client Integration

### API Methods
All methods available in `client/lib/api.ts`:

```typescript
// Get stock statistics
await api.getStockStats();

// Get all transactions with filters
await api.getStockTransactions({
  productId: 'optional',
  type: 'stock-in',
  limit: 50
});

// Create stock transaction
await api.createStockTransaction({
  productId: 'product_id',
  type: 'stock-in',
  quantity: 50,
  remarks: 'Received new shipment'
});

// Get product history
await api.getProductHistory('product_id', 20);
```

### Stock Update Page
Located at: `client/app/inventory/stock/page.tsx`

Features:
- Product selection dropdown
- Stock In / Stock Out buttons
- Quantity input
- Optional remarks
- Real-time stock preview
- Quick statistics sidebar
- Loading states
- Error handling

## Usage Flow

1. **User selects a product** from dropdown
2. **Chooses action type** (Stock In or Stock Out)
3. **Enters quantity** to add or remove
4. **Optionally adds remarks** for record keeping
5. **Submits the form**
6. **Backend validates**:
   - Product exists
   - Sufficient stock for stock-out
   - Valid quantity
7. **Updates product stock** in database
8. **Creates transaction record** for history
9. **Returns updated data** to frontend
10. **UI updates** with new stock levels

## Security

- All endpoints are protected (require authentication)
- User tracking for all transactions
- Transaction history is immutable (no updates/deletes)
- Stock cannot go below 0
- Validation on both client and server

## Testing

To test the stock management:

1. **Seed sample products** (if not already done):
   ```bash
   npm run seed:products
   ```

2. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

3. **Start the client**:
   ```bash
   cd client
   npm run dev
   ```

4. **Navigate to Stock page**:
   - Go to `http://localhost:3000/inventory/stock`
   - Login with admin credentials
   - Select a product
   - Try Stock In and Stock Out operations

## Error Handling

Common errors handled:
- Product not found
- Insufficient stock for stock-out
- Invalid transaction type
- Missing required fields
- Network errors
- Authentication errors

All errors show user-friendly toast notifications.

## Future Enhancements

Potential features to add:
- Stock alerts/notifications for low stock
- Bulk stock updates
- Stock transfer between locations
- Stock adjustment reasons (damaged, returned, etc.)
- Export transaction history to CSV/PDF
- Stock forecasting and predictions
- Barcode scanning integration
