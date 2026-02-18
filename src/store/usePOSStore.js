import { create } from 'zustand';

// Helper to make a unique key for product+variant
function makeKey(code, variantId) {
    return `${code}:${variantId || 'base'}`;
}

export const usePOSStore = create((set, get) => ({
    products: [],
    cart: [],
    search: '',
    setProducts: (p) => set({ products: p }),
    setSearch: (s) => set({ search: s }),

    /**
     * item = { code, name, price, variantId?, variantName? }
     */
    addToCart: (item) => {
        const key = `${item.code}:${item.variantId || 'base'}`;
        const { cart } = get();

        const existing = cart.find((x) => x.key === key);

        if (existing) {
            existing.qty += item.qty || 1;
            set({ cart: [...cart] });
        } else {
            set({
                cart: [
                    ...cart,
                    {
                        ...item,
                        qty: item.qty || 1,
                        key,
                    },
                ],
            });
        }
    },

    removeFromCart: (key) => set({ cart: get().cart.filter(x => x.key !== key) }),
    inc: (key) => set({ cart: get().cart.map(x => x.key === key ? { ...x, qty: x.qty + 1 } : x) }),
    dec: (key) => set({ cart: get().cart.map(x => x.key === key ? { ...x, qty: Math.max(1, x.qty - 1) } : x) }),
    clear: () => set({ cart: [] }),
}));