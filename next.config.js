/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // ----------------------------------------------------------------------
  // ★ 1. 静的コンテンツの生成抑制 (Flutterホスティングのための最重要設定) ★
  // Next.jsの全ページをサーバーレス関数として扱い、静的HTMLファイルの生成を無効化します。
  // これにより、Next.jsがルートや404ページをビルドしなくなり、
  // @vercel/static-build (Flutter) の成果物がVercelのルートとして優先されます。
  output: 'standalone', 

  // Next.jsにAPIルート（/pages/api/）以外のページを無視させるための設定
  // 従来のpagesディレクトリのAPIファイルと共存させるため
  pageExtensions: ['api.js', 'api.ts', 'api.jsx', 'api.tsx'],

  // App Router (appDir) を使用しないことを明示
  experimental: {
    appDir: false, 
  },
  // ----------------------------------------------------------------------


  // ----------------------------------------------------------------------
  // ★ 2. CORS (Cross-Origin Resource Sharing) の設定 (API通信用) ★
  // Flutter WebアプリからのAPIアクセスを許可するために重要です。
  async headers() {
    return [
      {
        // すべての API ルート (/api/...) に適用
        source: "/api/:path*",
        headers: [
          // 認証情報を含むリクエストを許可
          { key: "Access-Control-Allow-Credentials", value: "true" },
          
          // 任意のオリジンからのリクエストを許可 (開発用)
          // 本番環境では、フロントエンドのURLに限定することを強く推奨します。
          { key: "Access-Control-Allow-Origin", value: "*" }, 
          
          // 許可するHTTPメソッド
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          
          // 許可するヘッダー
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
  // ----------------------------------------------------------------------
};

module.exports = nextConfig;
