module.exports.useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(() => Promise.resolve()),
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
});
