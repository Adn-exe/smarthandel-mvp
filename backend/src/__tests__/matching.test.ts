import { selectBestProductForStore, MatchLevel, getProductMatchLevel } from '../utils/matching.js';
import { Product, Store } from '../types/index.js';

describe('Matching Utility', () => {
    const mockStore: Store = {
        id: 1,
        name: 'REMA 1000 Grünerløkka',
        chain: 'REMA',
        address: 'Thorvald Meyers gate 51',
        location: { lat: 59.922, lng: 10.759 },
        distance: 0
    };

    it('should correctly identify match levels', () => {
        const branchP = { id: 'b', store: 'REMA 1000 Grünerløkka', chain: 'REMA' } as Product;
        const chainP = { id: 'c', store: 'REMA 1000', chain: 'REMA' } as Product;
        const parentP = { id: 'p', store: 'Reitan', chain: 'Reitan' } as Product;

        expect(getProductMatchLevel(branchP, mockStore)).toBe(MatchLevel.BRANCH);
        expect(getProductMatchLevel(chainP, mockStore)).toBe(MatchLevel.CHAIN);
        expect(getProductMatchLevel(parentP, mockStore)).toBe(MatchLevel.PARENT);
    });

    it('should prioritize branch match over cheaper chain match', () => {
        const branchProduct = {
            id: 'p-branch',
            name: 'Milk',
            price: 20,
            store: 'REMA 1000 Grünerløkka',
            chain: 'REMA',
            relevanceScore: 0
        } as Product;

        const chainProduct = {
            id: 'p-chain',
            name: 'Milk',
            price: 15,
            store: 'REMA 1000',
            chain: 'REMA',
            relevanceScore: 0
        } as Product;

        const best = selectBestProductForStore([branchProduct, chainProduct], mockStore, ['p-branch', 'p-chain']);
        expect(best?.id).toBe('p-branch');
    });

    it('should prioritize house brand over cheaper generic brand', () => {
        const genericP = { id: 'generic', name: 'Milk', price: 15, store: 'REMA 1000', chain: 'REMA', relevanceScore: 0 } as Product;
        const houseP = { id: 'house', name: 'REMA 1000 Milk', price: 20, store: 'REMA 1000', chain: 'REMA', relevanceScore: 0 } as Product;

        const best = selectBestProductForStore([genericP, houseP], mockStore, ['generic', 'house']);
        expect(best?.id).toBe('house'); // House brand bonus wins
    });

    it('should prioritize First Price at KIWI as house brand', () => {
        const kiwiStore: Store = { id: 3, name: 'Kiwi Solli', chain: 'KIWI', address: '', location: { lat: 0, lng: 0 }, distance: 0 };
        const genericP = { id: 'g', name: 'Egg', price: 30, store: 'KIWI', chain: 'KIWI', relevanceScore: 0 } as Product;
        const firstPriceP = { id: 'fp', name: 'First Price Egg', price: 35, store: 'KIWI', chain: 'KIWI', relevanceScore: 0 } as Product;

        const best = selectBestProductForStore([genericP, firstPriceP], kiwiStore, ['g', 'fp']);
        expect(best?.id).toBe('fp');
    });
});

