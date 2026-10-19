import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { STOCK_EVENT } from '../lib/stockSync';

const CartContext = createContext();

function readStoredCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem('wholesale_cart') || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.key) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readStoredCart);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedOpen, setAddedOpen] = useState(false);
  const [addedItem, setAddedItem] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('wholesale_cart', JSON.stringify(cartItems));
    } catch {
      /* A full or blocked store must not take down the shop. */
    }
  }, [cartItems]);

  useEffect(() => {
    const onStock = (event) => {
      const absolute = event.detail?.absolute;
      if (!absolute) return;
      setCartItems((items) =>
        items.flatMap((item) => {
          if (absolute[item.productId] === undefined) return [item];
          const stock = Number(absolute[item.productId]);
          const nextStock = Number.isFinite(stock) ? Math.max(0, stock) : 0;
          const quantity = Math.min(Number(item.quantity) || 0, nextStock);
          if (quantity <= 0) return [];
          return [{ ...item, stock: nextStock, quantity }];
        }),
      );
    };
    window.addEventListener(STOCK_EVENT, onStock);
    return () => window.removeEventListener(STOCK_EVENT, onStock);
  }, []);

  const addToCart = useCallback((product, variant, quantity) => {
    const rawStock = Number(variant ? variant.stock : product?.stock);
    const stock = Number.isFinite(rawStock) ? rawStock : 0;
    if (!product?.id || stock <= 0) return;
    let safeQty = Math.max(1, Number(quantity) || 1);
    safeQty = Math.min(safeQty, stock);
    const itemKey = variant ? `${product.id}-${variant.id}` : `${product.id}-default`;
    const unitPrice = Number(variant ? variant.price : product.price) || 0;
    const title = variant ? `${product.name} (${variant.size})` : product.name;
    const image = product.image_url || '';
    const lotSize = Math.max(1, Number(product.min_wholesale_qty) || 1);
    const size = variant?.size || '';

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === itemKey);
      if (existing) {
        const nextQty = (Number(existing.quantity) || 0) + safeQty;
        return prev.map((item) =>
          item.key === itemKey
            ? {
                ...item,
                quantity: Math.min(nextQty, stock),
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
    const requested = Number(quantity);
    if (!Number.isFinite(requested) || requested <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCartItems((prev) =>
      prev.flatMap((item) => {
        if (item.key !== itemKey) return [item];
        const cap = Number(item.stock);
        const next = Number.isFinite(cap) ? Math.min(requested, Math.max(0, cap)) : requested;
        if (next <= 0) return [];
        return [{ ...item, quantity: next }];
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCartItems([]), []);

  const totalAmount = useMemo(
    () => cartItems.reduce((acc, item) => {
      const price = Number(item?.unitPrice);
      const qty = Number(item?.quantity);
      if (!Number.isFinite(price) || !Number.isFinite(qty)) return acc;
      return acc + price * qty;
    }, 0),
    [cartItems],
  );
  const totalCount = useMemo(
    () => cartItems.reduce((acc, item) => {
      const qty = Number(item?.quantity);
      return acc + (Number.isFinite(qty) ? qty : 0);
    }, 0),
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
