import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('wholesale_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('wholesale_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variant, quantity) => {
    const itemKey = variant ? `${product.id}-${variant.id}` : `${product.id}-default`;
    const unitPrice = variant ? variant.price : product.price;
    const title = variant ? `${product.name} (${variant.size})` : product.name;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.key === itemKey ? { ...item, quantity: item.quantity + quantity } : item
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
          quantity,
          productCode: product.product_code || 'WHOLESALE'
        }
      ];
    });

    setIsCartOpen(true);
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
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);