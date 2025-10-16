import { GoogleGenAI } from '@google/genai';

// ★★★ 🚨 1. APIキーの初期化 🚨 ★★★
// Next.jsの環境変数からAPIキーを取得
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// 課題リストのテンプレートデータ (コア情報は固定)
const caseTemplates = [
    {
        caseId: 'case_001',
        title: '緊急入院：急性心筋梗塞疑い',
        targetSkill: '正確性',
        coreInstruction: '70代男性の急性心筋梗塞疑いに関するカルテを作成します。時間軸、具体的な処置、医療用語の適切性に着目してください。',
        hintInstruction: '時間軸、処置の具体性、病棟へ「上げた」という表現の適切性を見直しましょう。',
    },
    {
        caseId: 'case_002',
        title: '経過観察：慢性腎不全',
        targetSkill: '臨床的配慮度',
        coreInstruction: '慢性腎不全患者の経過観察記録です。検査結果の推移と、それに対する主治医との連携内容の記録に着目してください。',
        hintInstruction: '報告の具体的な時間と、主治医からの指示内容を記録に追加しましょう。',
    },
    {
        caseId: 'case_003',
        title: '術後管理：腹腔鏡下胆嚢摘出術',
        targetSkill: '簡潔性',
        coreInstruction: '腹腔鏡下胆嚢摘出術後の患者管理記録です。主観的な表現を避け、客観的な情報と指示内容で簡潔に記述する能力が問われます。',
        hintInstruction: '「少し気分が悪そう」といった主観的な表現は避け、具体的な症状とそれに対する指示を明確に記述しましょう。',
    },
];

/**
 * Gemini APIを使用して課題のテキストにバリエーションを加える
 * @param {object} template 課題テンプレート
 * @returns {Promise<object>} バリエーションが加えられた課題データ
 */
async function generateCaseVariation(template) {
    if (!ai) {
        // APIキーがない場合はフォールバックデータを使用
        console.warn("API Key missing. Returning fallback data for case variation.");
        return {
            ...template,
            originalText: `【S】${template.coreInstruction.split('。')[0]}。${template.targetSkill}に問題があります。
【O】バイタル、フィジカルは記載なし。
【A】元の文章に不備が多い。
【P】修正が必要。`, // SOAP形式のダミーデータ
            hintInstruction: template.hintInstruction,
        };
    }

    // ★★★ 🚨 プロンプト修正点 1: 不十分さの強調とSOAP形式の要求 🚨 ★★★
    const systemInstruction = `あなたは経験豊富な医療シナリオジェネレーターです。研修医が書いたばかりのSOAP形式のカルテ文章を生成してください。
    
    生成するカルテは、以下の要素を**意図的に不十分または不適切**に含める必要があります。
    1. **SOAP形式 (Subjective, Objective, Assessment, Plan)** を意識しているが、各セクションの内容が**不足している、または混在している**。
    2. 主観的な表現や、曖昧で客観的ではない表現が含まれている。
    3. 時系列や具体的な処置内容が欠けている、または不正確である。
    4. 臨床的配慮に欠ける（例：「うるさい患者」など）表現が紛れ込んでいる。

    与えられた課題のコアメッセージを保持しつつ、患者の情報（年齢、時間など）はランダムに少しだけ変更し、元のシナリオに多様なバリエーションを加えた新しい問題文を生成してください。

以下の形式でJSONオブジェクトを返してください。
1. originalText: 修正が必要な、新しいバリエーションのSOAP形式カルテ文章
2. hintInstruction: 新しいoriginalTextの内容に合わせて微調整された具体的なヒント`;

    const prompt = `以下の課題テンプレートに基づいて、**SOAP形式で記載され、かつ不備が多い**異なるバリエーションのオリジナルテキスト（originalText）と、それに合わせたヒント（hintInstruction）を生成してください。

課題タイトル: ${template.title}
ターゲットスキル: ${template.targetSkill}
コアメッセージ: ${template.coreInstruction}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        originalText: { type: "STRING", description: "SOAP形式で記載された、不備が多いバリエーションカルテ文章" },
                        hintInstruction: { type: "STRING", description: "新しいオリジナルテキストに合わせた具体的なヒント" }
                    },
                    propertyOrdering: ["originalText", "hintInstruction"]
                }
            }
        });

        // JSON文字列をパース
        const generatedJson = JSON.parse(response.candidates[0].content.parts[0].text);

        return {
            ...template,
            originalText: generatedJson.originalText,
            hintInstruction: generatedJson.hintInstruction,
        };

    } catch (error) {
        console.error(`Error generating case variation for ${template.caseId}:`, error);
        // エラー時はフォールバックとしてテンプレートのコアメッセージを返す
        return {
            ...template,
            originalText: template.coreInstruction, 
            hintInstruction: template.hintInstruction,
        };
    }
}


/**
 * 課題リストを返すAPIハンドラ
 * @param {import('next').NextApiRequest} req 
 * @param {import('next').NextApiResponse} res 
 */
export default async function handler(req, res) { 
    if (req.method !== 'GET') {
        // OPTIONSメソッドはCORS処理のために許可されますが、
        // GET以外のリクエストは明示的にエラーとします。
        // Next.jsやVercelの設定でOPTIONSを適切に処理すればここは不要ですが、念のため。
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            return res.status(200).end();
        }
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const generatedCasesPromises = caseTemplates.map(generateCaseVariation);
        // すべての課題のバリエーション生成が完了するのを待つ
        const finalCases = await Promise.all(generatedCasesPromises);

        // CORSの問題を回避するため、適切なヘッダーを設定
        // ★確認済みのCORSヘッダーを再度設定
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // JSON形式でAIが生成したデータを返す
        res.status(200).json(finalCases);
    } catch (error) {
        console.error('Failed to process case list:', error);
        res.status(500).json({ message: '課題リストの生成中にサーバーエラーが発生しました。' });
    }
}