import { NextApiRequest, NextApiResponse } from 'next';
// @google/genai SDKのインポート
import { GoogleGenAI, Type } from '@google/genai'; 

// ---------------------------------------------------------------------------------
// AIクライアントの初期化
// Next.js環境では、環境変数を直接 process.env から取得します。
// 環境変数 GEMINI_API_KEY が Vercel または .env.local に設定されていることを前提とします。
// ---------------------------------------------------------------------------------
const apiKey = process.env.GEMINI_API_KEY;
// クライアントインスタンスは、APIキーが存在する場合のみ初期化
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!apiKey) {
    // 開発時にキーがない場合はコンソールに警告
    console.warn("GEMINI_API_KEY environment variable is not set. API calls will fail.");
}


// JSONスキーマ: 生成される補足情報の形式を定義
const SupplementalInfoSchema = {
    type: Type.OBJECT,
    properties: {
        category: { type: Type.STRING, description: '要求された情報のカテゴリ（例: vital, lab, physical）。' },
        // dataはカルテ記載にそのまま使えるように整形された文字列
        data: { type: Type.STRING, description: '生成された架空のデータ、またはアセスメント結果をカルテ記載に適した形式で記載。' },
        // noteは指導医からの簡潔なコメント
        note: { type: Type.STRING, description: 'そのデータが現在の患者の病態に与える影響についての簡潔なコメント。' }
    },
    required: ['category', 'data', 'note']
};

/**
 * 研修医のカルテ記載の文脈に基づいて、バイタルサイン、フィジカル所見、検査値などの架空の補足情報をAIに生成させるAPI。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // CORS対応のためのOPTIONSメソッドの処理
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ message: 'Method Not Allowed' }); return; }

    if (!ai) {
        // APIキーがない場合は、サービス利用不可を返す
        return res.status(503).json({ message: 'AI Engine Not Initialized. Missing GEMINI_API_KEY.' });
    }

    // リクエストボディからデータ抽出
    const { fullText, infoCategory } = req.body as { fullText?: string, infoCategory?: string };

    if (!fullText || !infoCategory) {
        return res.status(400).json({ message: 'Missing required fields: fullText (current chart) or infoCategory (vital/lab/physical).' });
    }

    try {
        const categoryMap: { [key: string]: string } = {
            'vital': 'バイタルサイン (体温, 血圧, 脈拍, 呼吸数, SpO2, 意識レベル) の結果',
            'physical': '主要なフィジカルアセスメント (胸部, 腹部, 神経学的所見) の結果',
            'lab': '緊急血液検査 (WBC, Hb, CRP, Na, K, Creなど) の結果'
        };

        const targetDescription = categoryMap[infoCategory] || '追加で必要な検査やアセスメント情報';

        // AIへの指示（システムインストラクション）
        const systemInstruction = `
            あなたは臨床研修指導医であり、研修医の求めに応じて、現在のカルテ記載の文脈に最も関連性の高い架空の臨床データを生成する役割を持っています。
            提供されたカルテ記載を読み、病態に矛盾しない、かつ研修医が修正に利用しやすい具体的な${targetDescription}を生成し、JSON形式で出力してください。
            結果は簡潔に、カルテ記載にすぐに利用できる形式（例: "BP 130/80mmHg, HR 95bpm, SpO2 96%(RA)"）で記載し、絶対に必要な情報のみを含めてください。
            注釈(note)には、そのデータが現在の病態をどのように裏付け/否定するか、簡潔な臨床的ヒントを記載してください。
        `;

        // AIへのユーザープロンプト
        const userPrompt = `
            現在のカルテ記載:\n\n${fullText}\n\nこの記載に基づき、研修医が「${targetDescription}」を求めています。病態に最も適した架空の結果を生成してください。
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                responseMimeType: 'application/json',
                responseSchema: SupplementalInfoSchema,
            },
        });

        // 応答のパースと検証
        const jsonString = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonString) {
             return res.status(500).json({ message: 'AI did not return a valid JSON response.' });
        }
        
        const infoResult = JSON.parse(jsonString);
        res.status(200).json(infoResult);

    } catch (error) {
        console.error('Gemini API error in supplemental_info:', error);
        // 詳細なエラーをクライアントに返さないようにする
        res.status(500).json({ message: 'Internal server error during info generation.' });
    }
}
