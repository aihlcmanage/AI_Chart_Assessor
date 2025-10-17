/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // ルートパス (/) を public/index.html にリダイレクトするための設定
  async redirects() {
    return [
      {
        // リクエスト元パス (ルート)
        source: '/',
        // リダイレクト先 (publicフォルダ内のindex.html)
        destination: '/index.html',
        // 一時的なリダイレクト (302) を使用
        permanent: false,
      },
    ];
  },

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
