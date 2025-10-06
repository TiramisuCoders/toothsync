import { loginAction } from './actions';

const mockGetAll = jest.fn(() => []);
const mockSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: mockGetAll,
    set: mockSet,
  })),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signInWithPassword: jest.fn(({ email, password }) => {
        if(email === 'test@example.com' && password === 'correctpassword') {
          return Promise.resolve({ data: { user: { id: '123' } }, error: null });
        } else {
          return Promise.resolve({ data: null, error: { message: 'Invalid credentials' } });
        }
      }),
    },
  }),
}));

describe('loginAction', () => {
  it('logs in successfully with correct credentials', async () => {
    const response = await loginAction('test@example.com', 'correctpassword');
    expect(response.data).toBeDefined();
    expect(response.error).toBeNull();
  });

  it('fails login with wrong credentials', async () => {
    const response = await loginAction('test@example.com', 'wrongpassword');
    expect(response.data).toBeNull();
    expect(response.error).toBeDefined();
  });
});
