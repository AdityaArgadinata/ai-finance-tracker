import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tambahkan baris ini untuk mengizinkan Ngrok
  allowedDevOrigins: [
    "3181-2404-8000-1023-1816-2929-4844-38e6-518a.ngrok-free.app"
  ],
};

export default nextConfig;