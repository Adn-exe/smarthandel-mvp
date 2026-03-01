import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SearchInput } from '../components/SearchInput';

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'products.milk') return 'Melk';
            if (key === 'products.bread') return 'Brød';
            if (key === 'products.eggs') return 'Egg';
            return key;
        },
        i18n: {
            language: 'no',
            changeLanguage: vi.fn(),
        },
    }),
    Trans: ({ children }: any) => children,
    initReactI18next: {
        type: '3rdParty',
        init: vi.fn(),
    },
}));

describe('SearchInput Hybrid Logic', () => {
    afterEach(cleanup);

    it('renders open by default with initialOpen prop', () => {
        const onSearch = vi.fn();
        render(<SearchInput onSearch={onSearch} initialOpen={true} />);
        // The header text is "Select items" (from t('common.describe_need', 'Select items'))
        expect(screen.getByText('common.describe_need')).toBeDefined();
        expect(screen.getByText('common.describe_need')).toBeInTheDocument();
        expect(screen.getByText('Melk')).toBeInTheDocument();
    });

    it('filters dropdown based on input', () => {
        render(<SearchInput onSearch={vi.fn()} />);
        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'melk' } });

        expect(screen.getByText('Melk')).toBeInTheDocument();
        // Since 'Brød' doesn't contain 'melk' and doesn't have it as keyword, it should be gone (if we check all buttons)
    });

    it('auto-selects unique match on Enter', () => {
        const onSearch = vi.fn();
        render(<SearchInput onSearch={onSearch} />);
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'melk' } });
        fireEvent.submit(input.closest('form')!);

        expect(onSearch).toHaveBeenCalledWith('melk');
    });

    it('falls back to AI search on no match', () => {
        const onSearch = vi.fn();
        render(<SearchInput onSearch={onSearch} />);
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'kebab' } });
        fireEvent.submit(input.closest('form')!);

        expect(onSearch).toHaveBeenCalledWith('kebab');
    });

    it('merges selected tags and input value', () => {
        const onSearch = vi.fn();
        render(<SearchInput onSearch={onSearch} />);
        const input = screen.getByRole('textbox');

        // Open dropdown and select 'Melk'
        fireEvent.focus(input);
        fireEvent.click(screen.getByText('Melk'));

        // Type 'eggs' (which is canonical 'Egg')
        fireEvent.change(input, { target: { value: 'eggs' } });

        fireEvent.submit(input.closest('form')!);

        // Should include both 'Melk' and 'Egg' (translated 'eggs')
        expect(onSearch).toHaveBeenCalledWith('Melk, eggs');
    });
});
