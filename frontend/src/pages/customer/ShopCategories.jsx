import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, Filter, Sparkles, Tag, Check, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../../components/customer/ProductCard';
import { getCategories, getProducts } from '../../services/api';

export default function ShopCategories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [selectedSort, setSelectedSort] = useState('newest');
  const [onlySale, setOnlySale] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState('');

  // Fetch all categories once
  useEffect(() => {
    async function fetchCatList() {
      const res = await getCategories();
      if (res.success && res.categories.length > 0) {
        setCategories(res.categories);
        // If no category was selected in URL query, default to first or keep empty for All
        if (!initialCategory && res.categories[0]) {
          setSelectedCategory(res.categories[0].slug || res.categories[0].name);
        }
      }
    }
    fetchCatList();
  }, [initialCategory]);

  // When query param changes in URL
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams]);

  // Fetch products when category or filters change
  useEffect(() => {
    async function fetchCategoryProducts() {
      setLoadingProducts(true);
      try {
        const params = {
          sort: selectedSort,
          page_size: 24,
        };

        if (selectedCategory && selectedCategory !== 'ALL') {
          params.category = selectedCategory;
        }
        if (initialSearch) {
          params.search = initialSearch;
        }
        if (onlyInStock) {
          params.in_stock = 'true';
        }
        if (maxPriceFilter) {
          params.max_price = maxPriceFilter;
        }

        const res = await getProducts(params);
        if (res.success) {
          let list = res.products || [];
          if (onlySale) {
            list = list.filter((p) => p.is_on_sale);
          }
          setProducts(list);
          setTotalCount(res.count);
        }
      } catch (err) {
        console.error('Error fetching category products', err);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchCategoryProducts();
  }, [selectedCategory, selectedSort, onlySale, onlyInStock, maxPriceFilter, initialSearch]);

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setSearchParams({ category: slug });
  };

  // Find active category object
  const activeCategoryObj = categories.find(
    (c) => c.slug === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Page Title & Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#9E8F94', marginBottom: '6px' }}>
          <span>Customer Portal</span>
          <ChevronRight size={12} />
          <span>Shop</span>
          <ChevronRight size={12} />
          <span style={{ color: '#B8505E', fontWeight: 600 }}>
            {activeCategoryObj?.name || 'All Collections'}
          </span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 700, margin: 0, color: '#1F191B' }}>
          {activeCategoryObj?.name || 'Ready-to-Wear Department'}
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#6B5E63', fontSize: '0.92rem' }}>
          Explore curated fashion drops, artisanal cuts, and signature blush palettes.
        </p>
      </div>

      {/* Dual Pane Layout (Reference Layout adapted to TARIKA) */}
      <div
        style={{
          display: 'flex',
          gap: '2.5rem',
          alignItems: 'flex-start',
        }}
        className="department-dual-pane"
      >
        {/* LEFT COLUMN: Vertical Department Tabs Sidebar */}
        <aside className="department-tabs-sidebar">
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8E3642', padding: '0 8px 8px 8px' }}>
            Departments
          </span>

          <button
            type="button"
            className={`department-tab-btn ${selectedCategory === 'ALL' || !selectedCategory ? 'is-active' : ''}`}
            onClick={() => handleCategorySelect('ALL')}
          >
            <span>All Departments</span>
            <ChevronRight size={14} />
          </button>

          {categories.map((cat) => {
            const isActive =
              selectedCategory === cat.slug ||
              selectedCategory.toLowerCase() === cat.name.toLowerCase();

            return (
              <button
                key={cat.id}
                type="button"
                className={`department-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => handleCategorySelect(cat.slug || cat.name)}
              >
                <span>{cat.name}</span>
                <span style={{ fontSize: '0.72rem', color: isActive ? '#B8505E' : '#9E8F94' }}>
                  {cat.product_count !== undefined ? cat.product_count : ''}
                </span>
              </button>
            );
          })}
        </aside>

        {/* RIGHT COLUMN: Category Hero & Product Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Department Hero Banner */}
          <div
            style={{
              borderRadius: '20px',
              padding: '2rem 2.5rem',
              background: 'linear-gradient(135deg, #FBF1F0 0%, #F7E4E2 60%, #F5D3D1 100%)',
              border: '1px solid rgba(216, 114, 126, 0.25)',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8E3642' }}>
                Featured Department
              </span>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, margin: '4px 0', color: '#1F191B' }}>
                {activeCategoryObj?.name || 'All Collections'}
              </h2>
              <p style={{ margin: 0, color: '#6B5E63', fontSize: '0.88rem' }}>
                {activeCategoryObj?.description || 'Curated with refined craftsmanship for the modern wardrobe.'}
              </p>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(240, 226, 224, 0.9)',
              marginBottom: '1.75rem',
            }}
          >
            {/* Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setOnlySale(!onlySale)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: `1px solid ${onlySale ? '#D8727E' : '#F0E2E0'}`,
                  backgroundColor: onlySale ? '#FBF1F0' : '#FAF7F5',
                  color: onlySale ? '#B8505E' : '#1F191B',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Tag size={13} />
                <span>On Sale</span>
                {onlySale && <Check size={12} />}
              </button>

              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: `1px solid ${onlyInStock ? '#D8727E' : '#F0E2E0'}`,
                  backgroundColor: onlyInStock ? '#FBF1F0' : '#FAF7F5',
                  color: onlyInStock ? '#B8505E' : '#1F191B',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>In Stock Only</span>
                {onlyInStock && <Check size={12} />}
              </button>

              <button
                type="button"
                onClick={() => setMaxPriceFilter(maxPriceFilter === '1000' ? '' : '1000')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: `1px solid ${maxPriceFilter === '1000' ? '#D8727E' : '#F0E2E0'}`,
                  backgroundColor: maxPriceFilter === '1000' ? '#FBF1F0' : '#FAF7F5',
                  color: maxPriceFilter === '1000' ? '#B8505E' : '#1F191B',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Under ₹1,000
              </button>

              <button
                type="button"
                onClick={() => setMaxPriceFilter(maxPriceFilter === '2000' ? '' : '2000')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: `1px solid ${maxPriceFilter === '2000' ? '#D8727E' : '#F0E2E0'}`,
                  backgroundColor: maxPriceFilter === '2000' ? '#FBF1F0' : '#FAF7F5',
                  color: maxPriceFilter === '2000' ? '#B8505E' : '#1F191B',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Under ₹2,000
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B5E63', fontWeight: 600 }}>Sort by:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: '1px solid #F0E2E0',
                  backgroundColor: '#FAF7F5',
                  fontSize: '0.82rem',
                  color: '#1F191B',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Newest Drops</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Products Count */}
          <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#6B5E63' }}>
            Showing <strong>{products.length}</strong> items
          </div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  style={{
                    aspectRatio: '3 / 4',
                    borderRadius: '18px',
                    backgroundColor: '#F5ECEB',
                    animation: 'pulseGlow 2s infinite ease-in-out',
                  }}
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {products.map((prod) => (
                <ProductCard key={prod.product_id || prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #F0E2E0',
              }}
            >
              <Sparkles size={36} color="#D8727E" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#1F191B', margin: '0 0 0.5rem 0' }}>
                No Products Match Your Filters
              </h3>
              <p style={{ color: '#6B5E63', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
                Try clearing your price or stock filters to view available garments.
              </p>
              <button
                type="button"
                className="tarika-btn-outline"
                onClick={() => {
                  setOnlySale(false);
                  setOnlyInStock(false);
                  setMaxPriceFilter('');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
