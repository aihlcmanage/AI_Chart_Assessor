import { useEffect } from 'react';
import { useRouter } from 'next/router';

// このコンポーネントは、ビルド時にNext.jsにルートが存在することを認識させるためのものです。
// 実行時には、即座に public/index.html へクライアントサイドでリダイレクトします。
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // publicフォルダ内の index.html にリダイレクト
    // Next.jsのルーティングに干渉しないように、通常のブラウザのロケーション置換を使用します。
    window.location.replace('/index.html');
  }, [router]);
  
  // リダイレクト中であることを示すローディングUI
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Loading Chart Assessor...</h1>
      <p>Redirecting to the main application page.</p>
    </div>
  );
}
