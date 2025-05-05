import { render, screen } from '@testing-library/react';
import App from './App';

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Navigate: ({ to }) => <div>Navigate to {to}</div>,
  Link: ({ children }) => children,
  useNavigate: () => jest.fn()
}));

// Mock auth utility
jest.mock('./utils/auth', () => ({
  isAuthenticated: () => false
}));

// Mock ToastContainer
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div>Toast Container</div>
}));

test('renders Contact Manager app', () => {
  render(<App />);
  const appElement = screen.getByText(/Contact Manager/i);
  expect(appElement).toBeInTheDocument();
});