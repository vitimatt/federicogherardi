/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['next-sanity', 'sanity'],
};

export default nextConfig;
