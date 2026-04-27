import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';

describe('Home', () => {
  it('renders the heading', () => {
    render(<Home />);
    expect(screen.getByText('Business App Frontend')).toBeInTheDocument();
  });
});