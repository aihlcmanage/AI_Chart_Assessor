/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // 1. ルートパス (/) で public/index.html を提供するために、
  //    trailingSlash を true に設定します。
  //    これにより、Next.jsのPagesルーターが存在しない場合に、
  //    public/index.htmlがルート (/) として機能することが期待されます。
  trailingSlash: true,
  
  // 2. ルートパスのリダイレクト設定は削除します（trailingSlashで代用）。
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/index.html',
  //       permanent: false,
  //     },
  //   ];
  // },

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
