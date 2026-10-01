import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Data Fetch
  const fetchData = async () => {
    setLoading(true);

    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) {
      setCategories(catData);
      if (catData.length > 0 && !categoryId) setCategoryId(catData[0].id);
    }

    const { data: prodData } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (prodData) setProducts(prodData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Stock Adjustment (+/-)
  const adjustStock = async (productId, currentStock, amount) => {
    const newStock = Math.max(0, (Number(currentStock) || 0) + amount);
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    } else {
      alert('Stock update error: ' + error.message);
    }
  };

  // Toggle Active Status
  const toggleActive = async (productId, currentStatus) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p => p.id === productId ? { ...p, is_active: !currentStatus } : p));
    }
  };

  // Submit New Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      alert('Product Name, Price, ebong Category select kora baddhotamulok!');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name: name.trim(),
            product_code: productCode.trim() || 'WHOLESALE',
            category_id: categoryId,
            price: Number(price),
            stock: Number(stock) || 0,
            description: description.trim(),
            image_url: imageUrl.trim() || '/wheels.png',
            is_active: true
          }
        ])
        .select('*, categories(name)')
        .single();

      if (error) {
        alert('Product add hote shomossha hoyeche: ' + error.message);
      } else if (data) {
        setProducts([data, ...products]);
        setName('');
        setProductCode('');
        setPrice('');
        setStock('50');
        setDescription('');
        setImageUrl('');
        alert('Product shofolbhabe add hoyeche!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              📦 Product & Stock Management
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Total Products: <strong>{products.length}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/admin/orders"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                color: '#0f172a',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px',
                border: '1px solid #cbd5e1'
              }}
            >
              📋 Orders Dashboard
            </Link>
            <button
              onClick={fetchData}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Add Product Form */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#0f172a' }}>➕ Notun Product Add Korun</h2>
          <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Product Name *</label>
              <input
                type="text"
                required
                placeholder="ex: Heavy Duty Castor Wheel"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Category *</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Product Code</label>
              <input
                type="text"
                placeholder="ex: WHL-001"
                value={productCode}
                onChange={e => setProductCode(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Wholesale Price (৳) *</label>
              <input
                type="number"
                required
                placeholder="ex: 80"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Initial Stock (Pcs)</label>
              <input
                type="number"
                placeholder="ex: 100"
                value={stock}
                onChange={e => setStock(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Image URL / Path</label>
              <input
                type="text"
                placeholder="ex: /wheels.png ba link"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Description</label>
              <input
                type="text"
                placeholder="Product summary / description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 24px',
                  backgroundColor: submitting ? '#94a3b8' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Adding...' : '✓ Add Product to Website'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Product Stock Table */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Live Stock & Visibility Control</h2>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Kono product pawa jay nai.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>
                    <th style={{ padding: '12px 20px' }}>Product</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Code</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Wholesale Rate</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Stock Status</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Quick Stock Action</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isOut = (Number(p.stock) || 0) <= 0;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontWeight: '600', color: '#0f172a' }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          {p.categories?.name || 'Hardware'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                            {p.product_code || 'WHOLESALE'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                          ৳{p.price}
                        </td>

                        {/* Stock Badge */}
                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: isOut ? '#fee2e2' : '#dcfce7',
                            color: isOut ? '#b91c1c' : '#15803d'
                          }}>
                            {isOut ? '⚠️ Stock Out (0)' : `✓ In Stock (${p.stock} pcs)`}
                          </span>
                        </td>

                        {/* Quick Stock Buttons */}
                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => adjustStock(p.id, p.stock, -10)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontWeight: '700' }}
                              title="10 pcs komano"
                            >
                              -10
                            </button>
                            <button
                              onClick={() => adjustStock(p.id, p.stock, -1)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', cursor: 'pointer', fontWeight: '700' }}
                              title="1 pc komano"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => adjustStock(p.id, p.stock, 1)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', cursor: 'pointer', fontWeight: '700' }}
                              title="1 pc barano"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => adjustStock(p.id, p.stock, 10)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontWeight: '700' }}
                              title="10 pcs barano"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => adjustStock(p.id, p.stock, 50)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#e0f2fe', color: '#0369a1', cursor: 'pointer', fontWeight: '700' }}
                              title="50 pcs notun chalan"
                            >
                              +50
                            </button>
                          </div>
                        </td>

                        {/* Visibility Toggle */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleActive(p.id, p.is_active)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: p.is_active ? '#0f172a' : '#94a3b8',
                              color: '#fff'
                            }}
                          >
                            {p.is_active ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}