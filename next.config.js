/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone' を追加し、Next.jsのビルドをAPI機能に特化させ、
  // 静的ファイル（public/index.html）の処理をVercelの静的ホスティングに任せる
  output: 'standalone', 

  // trailingSlash設定は不要（削除済み）

  // CORS設定
  async headers() {
    return [
      {
        // APIルート全体にCORSヘッダーを適用
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // 本番環境では特定のオリジンに絞ることを推奨しますが、ここではワイルドカード (*) を使用
          { key: "Access-Control-Allow-Origin", value: "*" }, 
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
