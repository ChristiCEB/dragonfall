/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tr.rbxcdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'rbxcdn.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
