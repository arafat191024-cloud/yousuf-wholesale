import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { STOCK_EVENT } from '../lib/stockSync';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('wholesale_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedOpen, setAddedOpen] = useState(false);
  const [addedItem, setAddedItem] = useState(null);

  useEffect(() => {
    localStorage.setItem('wholesale_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const onStock = (event) => {
      const absolute = event.detail?.absolute;
      if (!absolute) return;
      setCartItems((items) =>
        items.map((item) => (absolute[item.productId] === undefined ? item : { ...item, stock: absolute[item.productId] })),
      );
    };
    window.addEventListener(STOCK_EVENT, onStock);
    return () => window.removeEventListener(STOCK_EVENT, onStock);
  }, []);

  const addToCart = useCallback((product, variant, quantity) => {
    const stock = Number(variant ? variant.stock : product.stock) || 0;
    let safeQty = Math.max(1, Number(quantity) || 1);
    if (stock > 0) safeQty = Math.min(safeQty, stock);
    const itemKey = variant ? `${product.id}-${variant.id}` : `${product.id}-default`;
    const unitPrice = Number(variant ? variant.price : product.price) || 0;
    const title = variant ? `${product.name} (${variant.size})` : product.name;
    const image = product.image_url || '';
    const lotSize = Math.max(1, Number(product.min_wholesale_qty) || 1);
    const size = variant?.size || '';

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === itemKey);
      if (existing) {
        const nextQty = existing.quantity + safeQty;
        return prev.map((item) =>
          item.key === itemKey
            ? {
                ...item,
                quantity: stock > 0 ? Math.min(nextQty, stock) : nextQty,
                image: item.image || image,
                lotSize,
                size: item.size || size,
                stock,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          key: itemKey,
          productId: product.id,
          variantId: variant ? variant.id : null,
          title,
          unitPrice,
          quantity: safeQty,
          productCode: product.product_code || '',
          image,
          lotSize,
          size,
          stock,
        },
      ];
    });

    setAddedItem({
      key: itemKey,
      title,
      unitPrice,
      quantity: safeQty,
      image,
      lotSize,
      size,
      productCode: product.product_code || '',
      stock,
    });
    setAddedOpen(true);
  }, []);

  const removeFromCart = useCallback((itemKey) => {
    setCartItems((prev) => prev.filter((item) => item.key !== itemKey));
  }, []);

  const updateQuantity = useCallback((itemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.key !== itemKey) return item;
        const cap = Number(item.stock);
        const next = Number.isFinite(cap) && cap > 0 ? Math.min(quantity, cap) : quantity;
        return { ...item, quantity: next };
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCartItems([]), []);

  const totalAmount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cartItems],
  );
  const totalCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalAmount,
      totalCount,
      isCartOpen,
      setIsCartOpen,
      addedOpen,
      setAddedOpen,
      addedItem,
    }),
    [addedItem, addedOpen, addToCart, cartItems, clearCart, isCartOpen, removeFromCart, totalAmount, totalCount, updateQuantity],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
