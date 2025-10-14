AI-Driven-Chart-Risk-Assessor (AI駆動型カルテリスク評価エンジン)プロジェクト概要本プロジェクトは、医学生・研修医向けに特化された、**臨床的配慮度（Clinical Sensitivity）**を評価するカルテ添削学習アプリケーションです。単に文法や形式を採点するだけでなく、**「読む専門医がその文章をどう受け止めるか」「意図しない誤解や臨床的なリスクを生む可能性はないか」**という第三者視点からの定性的なフィードバックをAIが提供することで、実臨床で通用するコミュニケーション能力としてのカルテ記載スキル向上を目指します。💡 アプリの核となる機能1. 🚨 第三者視点レポート多忙な専門医のペルソナを設定し、以下の3つの観点からフィードバックを提供します。専門医の第一印象 (Gut Reaction): 読む側の体感を短文で表現。誤解リスク分析 (Misinterpretation Risk): 曖昧な表現がもたらす具体的な臨床上の危険性を指摘。信頼度評価 (Competence Implied): 文章から読み取れる書き手の能力や自信を評価。2. 📊 6軸評価と弱点ターゲットモード以下の6つの軸でスコアリングを行い、ユーザーの最も弱いスキル（特に臨床的配慮度）を改善するための課題を自動選定します。簡潔性、正確性、明瞭性、構成力、医学用語の適切さ、臨床的配慮度 (最重要)3. 🛡️ 安全性担保機構学習用ツールであり、実際の診療行為に利用できないことを明確にするため、全画面に警告フッターを常時表示し、初回起動時に免責事項への同意を必須化しています。🛠️ 技術スタック| 要素 | 技術 | 備考 || フロントエンド (UI/UX) | Flutter (Dart) | クロスプラットフォーム対応のモバイルアプリケーション。 || バックエンド (API/ロジック) | Next.js API Routes (TypeScript) | サーバーレス環境に最適化されたAPI。 || AI エンジン | Gemini API (gemini-2.5-flash) | 添削、6軸評価、第三者視点レポートの生成。 || データベース | Neon DB (PostgreSQL) | API利用制限カウンターとユーザー履歴の永続化。 |🚀 環境構築とセットアップ手順Step 1: バックエンド (Next.js API) のセットアップNext.js プロジェクトの依存関係をインストール:cd [your_project_directory]
npm install

環境変数の設定:ルートディレクトリに配置した .env.local ファイルに、以下の値を設定してください。GEMINI_API_KEYDATABASE_URL (Neon DB接続URL)データベーススキーマの実行:Neon DBコンソールまたはpsqlクライアントで、以下のSQLスキーマを作成してください。-- ユーザーの基本情報テーブル
CREATE TABLE IF NOT EXISTS users ( user_id VARCHAR(255) PRIMARY KEY );
-- 日次API利用回数カウンター
CREATE TABLE IF NOT EXISTS api_usage ( date DATE PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0 );
-- 学習履歴と6軸評価スコア
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    case_id VARCHAR(255) NOT NULL,
    modified_text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_score INTEGER NOT NULL,
    conciseness_score INTEGER NOT NULL,
    accuracy_score INTEGER NOT NULL,
    clarity_score INTEGER NOT NULL,
    structure_score INTEGER NOT NULL,
    terminology_score INTEGER NOT NULL,
    clinical_sensitivity_score INTEGER NOT NULL 
);

Step 2: フロントエンド (Flutter) のセットアップFlutter プロジェクトの依存関係をインストール:cd ai_driven_chart_risk_assessor_app
flutter pub get

APIのベースURL設定:Next.js APIをデプロイした後、lib/services/api_service.dart 内の _apiBaseUrl を、デプロイしたAPIのURLに変更してください。（ローカル開発時は .env.local の NEXT_PUBLIC_API_BASE_URL を参照）アプリの実行:flutter run

（モバイルシミュレータまたは実機で実行してください）⚠️ 注意事項本アプリケーションは学習用であり、実際の患者の診療、診断、治療方針の決定に利用することはできません。AIの評価結果は参考情報として利用し、必ず指導医のフィードバックに従ってください。