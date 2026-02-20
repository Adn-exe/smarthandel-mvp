import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, afterAll, beforeAll } from 'vitest';
import { SearchInput } from '../components/SearchInput';
import { StoreCard } from '../components/StoreCard';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: vi.fn(),
        },
    }),
    Trans: ({ children }: any) => children,
    initReactI18next: {
        type: '3rdParty',
        init: vi.fn(),
    },
}));

// ─── MSW Setup ──────────────────────────────────────────────────────
const handlers = [
    http.post('*/api/products/search', () => {
        return HttpResponse.json({
            success: true,
            items: [{ name: 'Melk', quantity: 1 }],
            comparison: {
                byStore: {},
                byItem: {},
                cheapestStore: 'REMA 1000',
                maxSavings: 10
            }
        });
    }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
});
afterAll(() => server.close());

// ─── Component Tests ────────────────────────────────────────────────

describe('SearchInput Component', () => {
    it('renders correctly with placeholder', () => {
        render(<SearchInput onSearch={vi.fn()} placeholder="Test placeholder" />);
        expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<SearchInput onSearch={vi.fn()} loading={true} />);
        expect(screen.getByText(/common.thinking/i)).toBeInTheDocument();
    });

    it('validates input (button disabled when empty)', () => {
        render(<SearchInput onSearch={vi.fn()} />);
        const submitButton = screen.getByRole('button', { name: /common.shop/i });
        expect(submitButton).toBeDisabled();
    });
});

describe('StoreCard Component', () => {
    const mockStore = {
        id: 1,
        name: 'Oslo City',
        chain: 'REMA 1000',
        address: 'Stenersgata 1',
        location: { lat: 59.91, lng: 10.75 },
        distance: 500,
        open_now: true
    };

    const mockItems = [
        { id: '1', name: 'Melk', price: 20, store: 'REMA 1000', chain: 'REMA', image_url: '', unit: 'l', totalPrice: 20, quantity: 1 }
    ];

    it('displays store information', () => {
        render(<StoreCard store={mockStore} items={mockItems} totalCost={20} distance={500} />);
        expect(screen.getByText(/REMA 1000/)).toBeInTheDocument();
        expect(screen.getByText(/Oslo City/)).toBeInTheDocument();
        expect(screen.getByText(/500\s?m/)).toBeInTheDocument();
    });

    it('shows prices correctly formatted', () => {
        const expensiveItems = [
            { id: '1', name: 'Expensive Item', price: 123.45, store: 'REMA 1000', chain: 'REMA', image_url: '', unit: 'l', totalPrice: 123.45, quantity: 1 }
        ];
        render(<StoreCard store={mockStore} items={expensiveItems} totalCost={123.45} distance={500} />);
        expect(screen.getByText(/123/)).toBeInTheDocument();
    });

    it('handles click events', () => {
        const onSelect = vi.fn();
        render(<StoreCard store={mockStore} items={mockItems} totalCost={20} distance={500} onSelect={onSelect} variant="detailed" />);
        // StoreCard uses onSelect prop and calls it via onClick on the wrapper div
        const textElement = screen.getByText(/Oslo City/);
        const card = textElement.closest('div[class*="cursor-pointer"]');
        if (card) fireEvent.click(card);
        expect(onSelect).toHaveBeenCalled();
    });
});

describe('ResultsDisplay Component', () => {
    const mockSingle = {
        store: { id: 1, name: 'Store A', chain: 'REMA', address: '', location: { lat: 0, lng: 0 }, distance: 100, open_now: true },
        items: [],
        totalCost: 100,
        distance: 100
    };

    const mockMulti = {
        stores: [],
        totalCost: 80,
        totalDistance: 200,
        savings: 20,
        savingsPercent: 20
    };

    it('shows multi-store view correctly', () => {
        render(
            <ResultsDisplay
                singleStores={[mockSingle]}
                multiStore={mockMulti}
                activeView="multi"
                recommendation="multi"
                onCreateList={vi.fn()}
                onReset={vi.fn()}
                requestedItems={[]}
            />
        );
        expect(screen.getByText(/results.smartRouteHeader/)).toBeInTheDocument();
        expect(screen.getByText(/results.totalExpense/)).toBeInTheDocument();
    });

    it('highlights savings when recommended', () => {
        render(
            <ResultsDisplay
                singleStores={[mockSingle]}
                multiStore={mockMulti}
                activeView="multi"
                onCreateList={vi.fn()}
                onReset={vi.fn()}
                recommendation="multi"
                requestedItems={[]}
            />
        );
        expect(screen.getByText(/results.totalExpense/)).toBeInTheDocument();
        expect(screen.getByText(/results.saveExtra/)).toBeInTheDocument();
    });

    it('recommends single store correctly', () => {
        render(
            <ResultsDisplay
                singleStores={[mockSingle]}
                multiStore={mockMulti}
                activeView="single"
                recommendation="single"
                onCreateList={vi.fn()}
                onReset={vi.fn()}
                requestedItems={[]}
            />
        );
        expect(screen.getByText(/results.bestSingleStoreHeader/)).toBeInTheDocument();
        expect(screen.getByText(/results.bestChoice/)).toBeInTheDocument();
    });
});
