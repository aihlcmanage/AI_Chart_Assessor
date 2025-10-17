/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // Vercelでの静的HTMLファイル (public/index.html) のルート表示は、
  // next.config.js ではなく、プロジェクトルートの vercel.json で
  // rewrites を使って設定するため、以下の設定は不要です。
  // trailingSlash: true,
  
  // CORS設定（変更なし）
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, 
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
