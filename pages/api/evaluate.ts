import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Type } from '@google/genai';
// データベースサービスが 'services/database.ts' にあることを想定
import { logEvaluation } from '../../services/database'; 

// ---------------------------------------------------------------------------------
// 1. 環境設定と初期化
// ---------------------------------------------------------------------------------
// GEMINI_API_KEYはVercelの環境変数に設定されていることを期待
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// 評価結果のJSONスキーマ定義 (フロントエンドの EvaluationResult モデルと一致させる)
const EvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        totalScore: { type: Type.INTEGER, description: '6軸評価の合計点（60点満点）。' },
        weaknessScores: {
            type: Type.OBJECT,
            description: '各スキル軸のスコア（10点満点）。キーは英語名（conciseness, accuracyなど）。',
            properties: {
                conciseness: { type: Type.INTEGER, description: '簡潔性のスコア (1-10点)' },
                accuracy: { type: Type.INTEGER, description: '正確性のスコア (1-10点)' },
                clarity: { type: Type.INTEGER, description: '明瞭性のスコア (1-10点)' },
                structure: { type: Type.INTEGER, description: '構成力のスコア (1-10点)' },
                terminology: { type: Type.INTEGER, description: '用語の適切さのスコア (1-10点)' },
                clinicalSensitivity: { type: Type.INTEGER, description: '臨床的配慮度のスコア (1-10点)' },
            }, 
            required: [
                'conciseness',
                'accuracy',
                'clarity',
                'structure',
                'terminology',
                'clinicalSensitivity'
            ]
        },
        strengths: {
            type: Type.ARRAY,
            description: '評価で特に良かった点、強みに関する簡潔なリスト（日本語）。',
            items: { type: Type.STRING }
        },
        improvementSuggestions: {
            type: Type.ARRAY,
            description: '全体的な改善点の簡潔なリスト（日本語）。',
            items: { type: Type.STRING }
        },
        gutReaction: { type: Type.STRING, description: '専門医の第一印象（Gut Reaction）。短い定性コメント（日本語）。' },
        misinterpretationRisk: { type: Type.STRING, description: '誤解リスク分析（Misinterpretation Risk）。具体的な危険性を指摘（日本語）。' },
        impliedCompetence: { type: Type.STRING, description: '信頼度評価（Competence Implied）。文章から読み取れる書き手の能力評価（日本語）。' },
        finalGoodChart: { type: Type.STRING, description: 'AIが生成した、この提出内容に基づいた模範的なカルテ記載（SOAP形式の日本語）。' },
        snippetSuggestions: {
            type: Type.ARRAY,
            description: '修正を推奨する具体的なスニペット（部分的なテキスト）のリスト。',
            items: {
                type: Type.OBJECT,
                properties: {
                    originalText: { type: Type.STRING, description: '修正すべき元の短いテキスト' },
                    replacementText: { type: Type.STRING, description: '提案する修正後の短いテキスト' }
                },
                required: ['originalText', 'replacementText']
            }
        }
    },
    required: [
        'totalScore', 
        'weaknessScores', 
        'strengths', 
        'improvementSuggestions', 
        'gutReaction',
        'misinterpretationRisk',
        'impliedCompetence',
        'finalGoodChart',
        'snippetSuggestions'
    ]
};

// ---------------------------------------------------------------------------------
// 2. APIルートハンドラー
// ---------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // CORS対応 (OPTIONSリクエストの処理)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    if (!ai) {
        res.status(503).json({ message: 'AI Engine Not Initialized. Missing GEMINI_API_KEY.' });
        return;
    }

    // ユーザー入力の取得
    const { user_id, caseId, fullText, evaluationMode, caseTitle, targetSkill, originalText } = req.body;

    if (!user_id || !caseId || !fullText || !evaluationMode) {
        return res.status(400).json({ message: 'Missing required fields: user_id, caseId, fullText, or evaluationMode.' });
    }

    try {
        // ---------------------------------------------------------------------------------
        // 3. プロンプト構築とAI呼び出し
        // ---------------------------------------------------------------------------------
        
        // ターゲットスキルに応じてシステム指示を調整
        const modeDescription = evaluationMode === 'clinical_sensitivity'
            ? '特に「臨床的配慮度」と「誤解リスク」を最重要視し、読む専門医がどう受け取るかに焦点を当てて評価してください。'
            : 'カルテの「正確性」と「構成力」を主軸に、客観的な情報伝達の観点から評価してください。';

        // プロンプト内で、評価軸の日本語名とJSONキーの英語名を対応付けます
        const scoreKeys = {
            '簡潔性': 'conciseness',
            '正確性': 'accuracy',
            '明瞭性': 'clarity',
            '構成力': 'structure',
            '用語の適切さ': 'terminology',
            '臨床的配慮度': 'clinicalSensitivity',
        };
        
        // AIへの評価軸の伝達を強化
        const scoreListForAI = Object.entries(scoreKeys).map(([jp, en]) => 
            `1. **${jp}** (${en}): ${jp}の基準に基づいた1-10点満点のスコアを出力し、JSONキーとして **${en}** を使用してください。`
        ).join('\n');


        const systemInstruction = `
            あなたは世界的に著名な臨床研修指導医であり、医学生・研修医のカルテ記載を評価するエキスパートです。
            以下の指示に従い、提出されたカルテ文章を厳格かつ建設的に評価し、必ず日本語のJSON形式で出力してください。
            
            ### 評価軸 (6軸 - 各10点満点):
            ${scoreListForAI}
            
            ### 評価モード:
            現在の評価モードは「${evaluationMode}」です。${modeDescription}
            
            ### 出力形式の厳守:
            必ず以下のJSONスキーマに従い、全てのフィールドを埋めてください。特に weaknessScores のキー名は {${Object.values(scoreKeys).join(', ')}} の英語名でなければなりません。
        `;

        const userPrompt = `
            ### 提出された情報:
            - **課題タイトル**: ${caseTitle}
            - **課題のターゲット**: ${targetSkill}
            - **元のAI生成カルテ**: ${originalText}
            
            ---
            
            ### 学生が提出した修正カルテ（評価対象）:
            ${fullText}
            
            ---
            
            上記のシステム指示と評価軸に基づき、「学生が提出した修正カルテ」を評価してください。
            特に、元のカルテと比較し、学生の修正によってどこが改善/悪化したかを明確に分析に含めてください。
            最終的に、指定されたJSONスキーマに従って、評価結果、点数、レポート、および修正スニペットを出力してください。
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                responseMimeType: 'application/json',
                responseSchema: EvaluationSchema,
                // 温度 (temperature) を少し下げることで、より安定した客観的なスコアリングを促す
                temperature: 0.6, 
            },
        });
        
        // ---------------------------------------------------------------------------------
        // 4. 結果のパースとデータベースロギング
        // ---------------------------------------------------------------------------------

        const jsonString = response.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!jsonString) {
             console.error("AI response was empty or malformed:", response);
             return res.status(500).json({ message: 'AI did not return a valid JSON response.' });
        }
        
        const evaluationResult = JSON.parse(jsonString);

        // データベースに評価結果を非同期でログに記録
        // NOT NULL制約違反を防ぐため、存在しない場合は 0 を設定
        // ★★★ 修正点: 6軸評価のすべてのスコアを logEvaluation に渡すように更新 ★★★
        const scoresToLog = {
            total_score: evaluationResult.totalScore || 0,
            conciseness_score: evaluationResult.weaknessScores?.conciseness || 0,
            accuracy_score: evaluationResult.weaknessScores?.accuracy || 0,
            clarity_score: evaluationResult.weaknessScores?.clarity || 0,
            structure_score: evaluationResult.weaknessScores?.structure || 0,
            terminology_score: evaluationResult.weaknessScores?.terminology || 0,
            clinical_sensitivity_score: evaluationResult.weaknessScores?.clinicalSensitivity || 0,
        };

        // modifiedTextの代わりにfullTextを渡し、評価レポート全体をログに含める
        await logEvaluation(user_id, caseId, fullText, scoresToLog, evaluationResult);


        // 成功レスポンス
        res.status(200).json(evaluationResult);

    } catch (error) {
        console.error('Gemini API or internal server error:', error);
        res.status(500).json({ message: 'Internal server error during evaluation.' });
    }
}
