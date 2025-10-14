/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境変数 NEXT_PUBLIC_API_BASE_URL (例: http://localhost:3000)
  // が、Flutter アプリの lib/services/case_api.dart に設定されていることを確認してください。
  
  // CORS (Cross-Origin Resource Sharing) の設定
  // Flutter Webアプリからのローカルアクセスを許可するために重要
  async headers() {
    return [
      {
        // すべての API ルート (/api/...) に適用
        source: "/api/:path*",
        headers: [
          // 認証情報を含むリクエストを許可
          { key: "Access-Control-Allow-Credentials", value: "true" },
          
          // ★ 重要な設定: 任意のオリジンからのリクエストを許可します。
          // 開発環境では "*" が便利ですが、本番環境ではフロントエンドのURLに限定することを強く推奨します。
          { key: "Access-Control-Allow-Origin", value: "*" }, 
          
          // 許可するHTTPメソッド
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          
          // 許可するヘッダー
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
