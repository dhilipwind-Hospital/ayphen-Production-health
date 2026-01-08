const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      // Use localhost for local development
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/api': '/api' }, // Keep /api prefix when forwarding to backend
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(504).send({ message: 'Gateway Timeout - Backend service may be unavailable' });
      },
    })
  );
};
