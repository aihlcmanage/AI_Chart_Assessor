/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.jsの出力を軽量なサーバービルドに設定し、API機能に特化させます。
  // これにより、静的ファイルホスティングとの役割分担を明確にします。
  output: 'standalone', 

  // APIルートへのリクエストに対するCORSヘッダーを設定します。
  async headers() {
    return [
      {
        // すべてのAPIルート（/api/*）に適用
        source: "/api/:path*",
        headers: [
          // 認証情報を伴うリクエストを許可
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // すべてのオリジンからのアクセスを許可
          { key: "Access-Control-Allow-Origin", value: "*" }, 
          // 許可するHTTPメソッド
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          // 許可するリクエストヘッダー
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
