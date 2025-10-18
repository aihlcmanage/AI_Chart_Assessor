// next/pages/index.tsx
import React from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        AI Chart Assessor
      </h1>
      <p className="text-gray-700 mb-8">
        デプロイが正常に完了しました。<br />
        Next.js + Tailwind CSS の設定が有効です。
      </p>
      <a
        href="/api/evaluate"
        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
      >
        API テストページへ
      </a>
    </main>
  );
}
