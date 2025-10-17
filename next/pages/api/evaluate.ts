import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Type } from '@google/genai';
// 相対パス方式で database.ts をインポート
import { logEvaluation } from '../../../services/database'; 

// ---------------------------------------------------------------------------------
// 1. 環境設定と初期化
// ---------------------------------------------------------------------------------
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// 評価結果のJSONスキーマ定義
const EvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        totalScore: { type: Type.INTEGER, description: '6軸評価の合計点（60点満点）。' },
        weaknessScores: {
            type: Type.OBJECT,
            description: '各スキル軸のスコア（10点満点）。キーは英語名。',
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
        strengths: { type: Type.ARRAY, description: '評価で特に良かった点のリスト', items: { type: Type.STRING } },
        improvementSuggestions: { type: Type.ARRAY, description: '改善点のリスト', items: { type: Type.STRING } },
        gutReaction: { type: Type.STRING, description: '専門医の第一印象' },
        misinterpretationRisk: { type: Type.STRING, description: '誤解リスク分析' },
        impliedCompetence: { type: Type.STRING, description: '信頼度評価' },
        finalGoodChart: { type: Type.STRING, description: '模範カルテ（SOAP形式）' },
        snippetSuggestions: {
            type: Type.ARRAY,
            description: '修正を推奨する具体的スニペット',
            items: {
                type: Type.OBJECT,
                properties: {
                    originalText: { type: Type.STRING },
                    replacementText: { type: Type.STRING }
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

    const { user_id, caseId, fullText, evaluationMode, caseTitle, targetSkill, originalText } = req.body;

    if (!user_id || !caseId || !fullText || !evaluationMode) {
        return res.status(400).json({ message: 'Missing required fields: user_id, caseId, fullText, or evaluationMode.' });
    }

    try {
        // プロンプト構築
        const modeDescription = evaluationMode === 'clinical_sensitivity'
            ? '特に「臨床的配慮度」と「誤解リスク」を重視。'
            : 'カルテの「正確性」と「構成力」を主軸に評価。';

        const scoreKeys = {
            '簡潔性': 'conciseness',
            '正確性': 'accuracy',
            '明瞭性': 'clarity',
            '構成力': 'structure',
            '用語の適切さ': 'terminology',
            '臨床的配慮度': 'clinicalSensitivity',
        };

        const scoreListForAI = Object.entries(scoreKeys).map(([jp, en]) =>
            `1. **${jp}** (${en}): ${jp}の基準に基づいた1-10点`
        ).join('\n');

        const systemInstruction = `
あなたは世界的に著名な臨床研修指導医です。
評価軸:
${scoreListForAI}
評価モード: ${evaluationMode} - ${modeDescription}
必ずJSONスキーマに従って出力してください。
        `;

        const userPrompt = `
課題タイトル: ${caseTitle}
ターゲットスキル: ${targetSkill}
元のカルテ: ${originalText}
提出カルテ: ${fullText}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                responseMimeType: 'application/json',
                responseSchema: EvaluationSchema,
                temperature: 0.6
            }
        });

        const jsonString = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!jsonString) {
            console.error("AI response was empty or malformed:", response);
            return res.status(500).json({ message: 'AI did not return valid JSON.' });
        }

        const evaluationResult = JSON.parse(jsonString);

        const scoresToLog = {
            total_score: evaluationResult.totalScore || 0,
            conciseness_score: evaluationResult.weaknessScores?.conciseness || 0,
            accuracy_score: evaluationResult.weaknessScores?.accuracy || 0,
            clarity_score: evaluationResult.weaknessScores?.clarity || 0,
            structure_score: evaluationResult.weaknessScores?.structure || 0,
            terminology_score: evaluationResult.weaknessScores?.terminology || 0,
            clinical_sensitivity_score: evaluationResult.weaknessScores?.clinicalSensitivity || 0,
        };

        await logEvaluation(user_id, caseId, fullText, scoresToLog, evaluationResult);

        res.status(200).json(evaluationResult);

    } catch (error) {
        console.error('Gemini API or internal server error:', error);
        res.status(500).json({ message: 'Internal server error during evaluation.' });
    }
}
