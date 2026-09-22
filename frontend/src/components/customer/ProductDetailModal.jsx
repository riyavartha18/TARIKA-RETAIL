import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Check,
  MapPin,
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export default function ProductDetailModal() {
  const {
    activeModalProduct,
    closeProductDetail,
    isWishlisted,
    toggleWishlist,
    addToBag,
  } = useCustomer();

  const [quantity, setQuantity] = useState(1);
  const [addingToBag, setAddingToBag] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setQuantity(1);
    setSelectedImageIndex(0);
    setJustAdded(false);
  }, [activeModalProduct]);

  if (!activeModalProduct) return null;

  const product = activeModalProduct;
  const productId = product.product_id || product.id;
  const wishlisted = isWishlisted(productId);

  const basePrice = Number(product.base_price || 0);
  const salePrice = product.sale_price ? Number(product.sale_price) : null;
  const isOnSale = product.is_on_sale && salePrice && salePrice < basePrice;
  const currentPrice = isOnSale ? salePrice : basePrice;

  const discountPercent = isOnSale
    ? Math.round(((basePrice - salePrice) / basePrice) * 100)
    : 0;

  const totalStock = product.total_stock !== undefined ? product.total_stock : 10;
  const isOutOfStock = totalStock <= 0;

  // Build image array
  const images = [];
  if (product.primary_image) images.push(product.primary_image);
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img) => {
      const url = typeof img === 'string' ? img : img.image_url;
      if (url && !images.includes(url)) images.push(url);
    });
  }
  if (images.length === 0) {
    images.push(
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
    );
  }

  const activeImage = images[selectedImageIndex] || images[0];

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < totalStock) setQuantity(quantity + 1);
  };

  const handleAdd = async () => {
    if (isOutOfStock || addingToBag) return;
    setAddingToBag(true);
    const res = await addToBag(product, quantity);
    setAddingToBag(false);
    if (res && res.success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeProductDetail}>
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '2rem' }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeProductDetail}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#FAF7F5',
            border: '1px solid rgba(216, 114, 126, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1F191B',
            zIndex: 10,
            transition: 'all 0.2s ease',
          }}
          aria-label="Close product modal"
        >
          <X size={18} />
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.4fr)',
            gap: '2.5rem',
            alignItems: 'start',
          }}
          className="product-modal-grid"
        >
          {/* LEFT: Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '3 / 4',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#FAF7F5',
                position: 'relative',
              }}
              className="zoom-container"
            >
              <img
                src={activeImage}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {isOnSale && (
                <span className="product-badge-sale" style={{ top: '16px', left: '16px' }}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail selector if multiple images */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '64px',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: idx === selectedImageIndex ? '2px solid #D8727E' : '1px solid #F0E2E0',
                      padding: 0,
                      cursor: 'pointer',
                      flexShrink: 0,
                      backgroundColor: '#FAF7F5',
                    }}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Specs & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#8E3642',
                  fontWeight: 700,
                }}
              >
                {product.category?.name || product.category_name || 'Ready to Wear'}
              </span>
              <h2
                style={{
                  margin: '4px 0 8px 0',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#1F191B',
                  lineHeight: 1.25,
                }}
              >
                {product.name}
              </h2>
              {product.sku && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#9E8F94' }}>
                  SKU: {product.sku}
                </p>
              )}
            </div>

            {/* Price section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: '#FAF7F5',
                borderRadius: '12px',
                border: '1px solid rgba(216, 114, 126, 0.2)',
              }}
            >
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#B8505E',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {isOnSale && (
                <span
                  style={{
                    fontSize: '1.1rem',
                    color: '#9E8F94',
                    textDecoration: 'line-through',
                  }}
                >
                  ₹{basePrice.toLocaleString('en-IN')}
                </span>
              )}
              {isOnSale && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#D8727E',
                    backgroundColor: '#FBF1F0',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Save ₹{(basePrice - salePrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Description */}
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: '#6B5E63',
              }}
            >
              {product.description ||
                'Designed with precision couture craftsmanship. Created for effortless high-fashion wear with sumptuous comfort and delicate contouring.'}
            </p>

            {/* Live Real-time Stock Inventory Breakdown */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: isOutOfStock ? '#FFF1F2' : '#F0FDF4',
                border: `1px solid ${isOutOfStock ? '#FECDD3' : '#BBF7D0'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isOutOfStock ? '#E04D60' : '#16A34A',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: isOutOfStock ? '#9F1239' : '#166534',
                  }}
                >
                  {isOutOfStock
                    ? 'Currently Out of Stock'
                    : `In Stock — ${totalStock} units available for instant dispatch`}
                </span>
              </div>

              {/* Warehouse distribution details if present */}
              {product.inventory_by_warehouse && product.inventory_by_warehouse.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6B5E63', fontWeight: 600 }}>
                    TARIKA Fulfillment Centers:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {product.inventory_by_warehouse.map((wh, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.72rem',
                          backgroundColor: '#FFFFFF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#1F191B',
                        }}
                      >
                        <MapPin size={10} color="#B8505E" />
                        {wh.warehouse_name}: <strong>{wh.quantity}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1F191B' }}>
                  Quantity:
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #F0E2E0',
                    borderRadius: '9999px',
                    backgroundColor: '#FAF7F5',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      background: 'none',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: quantity <= 1 ? '#C4B5B8' : '#1F191B',
                    }}
                  >
                    -
                  </button>
                  <span
                    style={{
                      width: '40px',
                      textAlign: 'center',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#1F191B',
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= totalStock}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      background: 'none',
                      cursor: quantity >= totalStock ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: quantity >= totalStock ? '#C4B5B8' : '#1F191B',
                    }}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#9E8F94' }}>
                  Max {totalStock} per order
                </span>
              </div>
            )}

            {/* Action Buttons: Add to Bag & Wishlist */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="tarika-btn-primary"
                onClick={handleAdd}
                disabled={isOutOfStock || addingToBag}
                style={{
                  flex: 1,
                  padding: '0.95rem 1.5rem',
                  fontSize: '0.92rem',
                }}
              >
                {justAdded ? (
                  <>
                    <Check size={18} />
                    <span>Added to Bag!</span>
                  </>
                ) : addingToBag ? (
                  <span>Adding to Bag...</span>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: `1px solid ${wishlisted ? '#D8727E' : 'rgba(216, 114, 126, 0.3)'}`,
                  backgroundColor: wishlisted ? '#FBF1F0' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.25s ease',
                }}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  size={22}
                  fill={wishlisted ? '#D8727E' : 'none'}
                  color="#D8727E"
                  className={wishlisted ? 'animate-heart-beat' : ''}
                />
              </button>
            </div>

            {/* Boutique Perks */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                paddingTop: '1rem',
                borderTop: '1px solid #F0E2E0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={16} color="#8E3642" />
                <span style={{ fontSize: '0.78rem', color: '#6B5E63' }}>Express Courier</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#8E3642" />
                <span style={{ fontSize: '0.78rem', color: '#6B5E63' }}>Authentic Couture</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
