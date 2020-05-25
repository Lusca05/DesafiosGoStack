import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const productsResult = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsResult !== null) {
        setProducts(JSON.parse(productsResult));
        return;
      }

      setProducts([]);
    }

    loadProducts();
  }, []);

  const saveInStorage = useCallback(async () => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products),
    );
  }, [products]);

  const increment = useCallback(
    async id => {
      // INCREMENTS A PRODUCT QUANTITY IN THE CART
      const newProducts = [...products];

      const indexProduct = newProducts.findIndex(product => product.id === id);

      newProducts[indexProduct] = {
        ...newProducts[indexProduct],
        quantity: newProducts[indexProduct].quantity + 1,
      };

      setProducts(newProducts);
      saveInStorage();
    },
    [products, saveInStorage],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      // ADD A NEW ITEM TO THE CART
      const { id, image_url, title, price } = product;
      const findProduct = products.find(prod => prod.id === id);
      if (findProduct) {
        increment(findProduct.id);
        return;
      }

      const newProduct: Product = {
        id,
        title,
        image_url,
        price,
        quantity: 1,
      };

      setProducts([...products, newProduct]);
      saveInStorage();
    },
    [products, increment, saveInStorage],
  );

  const decrement = useCallback(
    async id => {
      // DECREMENTS A PRODUCT QUANTITY IN THE CART

      const newProducts = [...products];

      const indexProduct = newProducts.findIndex(product => product.id === id);

      newProducts[indexProduct] = {
        ...newProducts[indexProduct],
        quantity: newProducts[indexProduct].quantity - 1,
      };

      setProducts(newProducts);
      saveInStorage();
    },
    [products, saveInStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
