import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { ShoppingItem, Location } from '../types';

interface ShoppingListState {
    items: ShoppingItem[];
    location: Location | null;
}

type ShoppingListAction =
    | { type: 'SET_ITEMS'; items: ShoppingItem[] }
    | { type: 'ADD_ITEMS'; items: ShoppingItem[] }
    | { type: 'UPDATE_QUANTITY'; index: number; delta: number }
    | { type: 'REMOVE_ITEM'; index: number }
    | { type: 'LOCK_BRAND'; index: number; brand: string | undefined; productId?: string; productDetails?: any }
    | { type: 'SET_LOCATION'; location: Location | null };

interface ShoppingListContextType extends ShoppingListState {
    setItems: (items: ShoppingItem[]) => void;
    addItems: (items: ShoppingItem[]) => void;
    updateQuantity: (index: number, delta: number) => void;
    removeItem: (index: number) => void;
    lockBrand: (index: number, brand: string | undefined, productId?: string, productDetails?: any) => void;
    setLocation: (location: Location | null) => void;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

function shoppingListReducer(state: ShoppingListState, action: ShoppingListAction): ShoppingListState {
    switch (action.type) {
        case 'SET_ITEMS':
            return { ...state, items: action.items };

        case 'ADD_ITEMS': {
            const newItems = [...state.items];
            action.items.forEach(newItem => {
                const existingIndex = newItems.findIndex(item =>
                    (item.englishName || item.name).toLowerCase() === (newItem.englishName || newItem.name).toLowerCase()
                );

                if (existingIndex !== -1) {
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: newItems[existingIndex].quantity + (newItem.quantity || 1)
                    };
                } else {
                    newItems.push({ ...newItem, quantity: newItem.quantity || 1 });
                }
            });
            return { ...state, items: newItems };
        }

        case 'UPDATE_QUANTITY':
            return {
                ...state,
                items: state.items.map((item, i) =>
                    i === action.index
                        ? { ...item, quantity: Math.max(1, item.quantity + action.delta) }
                        : item
                )
            };

        case 'REMOVE_ITEM':
            return {
                ...state,
                items: state.items.filter((_, i) => i !== action.index)
            };

        case 'LOCK_BRAND':
            return {
                ...state,
                items: state.items.map((item, i) =>
                    i === action.index
                        ? {
                            ...item,
                            lockedBrand: action.brand,
                            lockedProductId: action.productId,
                            lockedProductDetails: action.productDetails
                        }
                        : item
                )
            };

        case 'SET_LOCATION':
            return { ...state, location: action.location };

        default:
            return state;
    }
}

export function ShoppingListProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(shoppingListReducer, {
        items: [],
        location: null
    });

    const setItems = useCallback((items: ShoppingItem[]) => dispatch({ type: 'SET_ITEMS', items }), []);
    const addItems = useCallback((items: ShoppingItem[]) => dispatch({ type: 'ADD_ITEMS', items }), []);
    const updateQuantity = useCallback((index: number, delta: number) => dispatch({ type: 'UPDATE_QUANTITY', index, delta }), []);
    const removeItem = useCallback((index: number) => dispatch({ type: 'REMOVE_ITEM', index }), []);
    const lockBrand = useCallback((index: number, brand: string | undefined, productId?: string, productDetails?: any) => dispatch({ type: 'LOCK_BRAND', index, brand, productId, productDetails }), []);
    const setLocation = useCallback((location: Location | null) => dispatch({ type: 'SET_LOCATION', location }), []);

    return (
        <ShoppingListContext.Provider value={{
            ...state,
            setItems,
            addItems,
            updateQuantity,
            removeItem,
            lockBrand,
            setLocation
        }}>
            {children}
        </ShoppingListContext.Provider>
    );
}

export function useShoppingList() {
    const context = useContext(ShoppingListContext);
    if (!context) {
        throw new Error('useShoppingList must be used within a ShoppingListProvider');
    }
    return context;
}
