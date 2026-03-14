/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.40.80.158", "192.168.1.2", "localhost"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
