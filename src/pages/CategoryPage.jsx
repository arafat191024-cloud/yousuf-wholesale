import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

export default function CategoryPage() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const { addToCart } = useCart(); // Cart Context theke addToCart function ana holo

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    async function fetchCategoryAndProducts() {
      setLoading(true);

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (catError || !catData) {
        setLoading(false);
        return;
      }
      setCategory(catData);

      const { data: prodData } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('category_id', catData.id)
        .eq('is_active', true);

      setProducts(prodData || []);

      const initVariants = {};
      const initQuantities = {};
      (prodData || []).forEach((p) => {
        if (p.product_variants && p.product_variants.length > 0) {
          initVariants[p.id] = p.product_variants[0];
        }
        initQuantities[p.id] = 10;
      });
      setSelectedVariants(initVariants);
      setQuantities(initQuantities);

      setLoading(false);
    }

    fetchCategoryAndProducts();
  }, [slug]);

  const handleVariantChange = (productId, variant) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const handleQuantityChange = (productId, val) => {
    const qty = Math.max(1, parseInt(val) || 1);
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  // হোমপেজের সাথে মিলিয়ে ভেতরের পেজের ছবি
  const getProductImage = () => {
    if (slug === 'wheels') {
      return '/wheels.png'; // আপনার সেভ করা আসল চাকার ছবি
    }
    if (slug === 'door-locks') {
      return 'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=600';
    }
    if (slug === 'handle-locks') {
      return 'https://images.pexels.com/photos/5691544/pexels-photo-5691544.jpeg?auto=compress&cs=tinysrgb&w=600';
    }
    if (slug === 'handles') {
      return 'https://images.pexels.com/photos/7174391/pexels-photo-7174391.jpeg?auto=compress&cs=tinysrgb&w=600';
    }
    return '/wheels.png';
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontSize: '18px', color: '#64748b' }}>
        {t.loading}
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h2>ক্যাটাগরি খুঁজে পাওয়া যায়নি!</h2>
        <Link to="/" style={{ color: '#2563eb' }}>{t.home}</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '25px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
          {t.allCategories}
        </Link>
        <h1 style={{ fontSize: '28px', marginTop: '10px', color: '#0f172a' }}>{category.name}</h1>
      </div>

      {products.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
          <p style={{ color: '#64748b', margin: 0 }}>{t.noProducts}</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '24px'
        }}>
          {products.map((prod) => {
            const hasVariants = prod.product_variants && prod.product_variants.length > 0;
            const currentVariant = selectedVariants[prod.id];
            const displayPrice = hasVariants && currentVariant ? currentVariant.price : prod.price;
            const currentQty = quantities[prod.id] || 10;

            return (
              <div key={prod.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
                background: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                {/* Sale Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  zIndex: 2,
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}>
                  Sale!
                </div>

                <div>
                  {/* হোমপেজের মতো প্রোডাক্টের ছবি */}
                  <div style={{
                    width: '100%',
                    height: '210px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    marginBottom: '14px'
                  }}>
                    <img
                      src={getProductImage()}
                      alt={prod.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#475569', fontWeight: '600' }}>
                    {prod.product_code || 'WHOLESALE'}
                  </span>
                  <h3 style={{ margin: '8px 0 6px 0', fontSize: '17px', color: '#0f172a', fontWeight: '600' }}>
                    {prod.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: '1.4' }}>
                    {prod.description}
                  </p>

                  {/* সাইজ ভ্যারিয়েন্ট */}
                  {hasVariants && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                        {t.selectSize}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {prod.product_variants.map((v) => {
                          const isSelected = currentVariant?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => handleVariantChange(prod.id, v)}
                              type="button"
                              style={{
                                fontSize: '12px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: isSelected ? '2px solid #0f172a' : '1px solid #cbd5e1',
                                background: isSelected ? '#0f172a' : '#f8fafc',
                                color: isSelected ? '#ffffff' : '#0f172a',
                                fontWeight: isSelected ? '600' : '400'
                              }}
                            >
                              {v.size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{t.wholesaleRate}</span>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                        ৳{displayPrice} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>{t.perPiece}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        {t.quantity}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={currentQty}
                        onChange={(e) => handleQuantityChange(prod.id, e.target.value)}
                        style={{
                          width: '70px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          textAlign: 'center',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(prod, currentVariant, currentQty);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    {t.addToCart}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}