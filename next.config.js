/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // 以前のデプロイの課題解決のため、
  // output: 'standalone' および pageExtensions の設定を削除し、
  // Vercelのルーティング設定 (vercel.json) に制御を委ねます。
  // これにより、Next.jsの不必要な静的ページ生成が抑制されることを期待します。

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
