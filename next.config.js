/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // 1. Next.jsの全ページをサーバーレス関数として扱い、静的HTMLファイルの生成を無効化
  // この設定を維持します。
  output: 'standalone', 

  // 2. 認識するファイル拡張子を、API関連のものだけに限定します。
  // これにより、Next.jsは /pages ディレクトリ内の他のファイルを無視し、
  // /404 などのデフォルト静的ページ生成を停止すると期待されます。
  pageExtensions: ['api.js', 'api.ts', 'api.jsx', 'api.tsx'],

  // 3. CORS設定（変更なし）
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
