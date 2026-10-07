import { createContext, useContext, useState, useEffect } from 'react';

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

  const addToCart = (product, variant, quantity) => {
    const safeQty = Math.max(1, Number(quantity) || 1);
    const itemKey = variant ? `${product.id}-${variant.id}` : `${product.id}-default`;
    const unitPrice = Number(variant ? variant.price : product.price) || 0;
    const title = variant ? `${product.name} (${variant.size})` : product.name;
    const image = product.image_url || '';
    const lotSize = Math.max(1, Number(product.min_wholesale_qty) || 1);
    const size = variant?.size || '';

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.key === itemKey
            ? { ...item, quantity: item.quantity + safeQty, image: item.image || image, lotSize, size: item.size || size }
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
    });
    setAddedOpen(true);
  };

  const removeFromCart = (itemKey) => {
    setCartItems((prev) => prev.filter((item) => item.key !== itemKey));
  };

  const updateQuantity = (itemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.key === itemKey ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCartItems([]);

  const totalAmount = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
