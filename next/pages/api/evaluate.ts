import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Type } from '@google/genai';
import { logEvaluation, DBScores } from '../../../services/database';

// GEMINI_API_KEY 取得
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const EvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        totalScore: { type: Type.INTEGER },
        weaknessScores: {
            type: Type.OBJECT,
            properties: {
                conciseness: { type: Type.INTEGER },
                accuracy: { type: Type.INTEGER },
                clarity: { type: Type.INTEGER },
                structure: { type: Type.INTEGER },
                terminology: { type: Type.INTEGER },
                clinicalSensitivity: { type: Type.INTEGER },
            },
            required: ['conciseness','accuracy','clarity','structure','terminology','clinicalSensitivity']
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        gutReaction: { type: Type.STRING },
        misinterpretationRisk: { type: Type.STRING },
        impliedCompetence: { type: Type.STRING },
        finalGoodChart: { type: Type.STRING },
        snippetSuggestions: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { originalText: { type: Type.STRING }, replacementText: { type: Type.STRING } }, 
                required: ['originalText', 'replacementText'] 
            } 
        }
    },
    required: ['totalScore','weaknessScores','strengths','improvementSuggestions','gutReaction','misinterpretationRisk','impliedCompetence','finalGoodChart','snippetSuggestions']
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    if (!ai) return res.status(503).json({ message: 'AI Engine Not Initialized. Missing GEMINI_API_KEY.' });

    const { user_id, caseId, fullText, evaluationMode, caseTitle, targetSkill, originalText } = req.body;

    if (!user_id || !caseId || !fullText || !evaluationMode) {
        return res.status(400).json({ message: 'Missing required fields: user_id, caseId, fullText, or evaluationMode.' });
    }

    try {
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
        if (!jsonString) return res.status(500).json({ message: 'AI did not return valid JSON.' });

        const evaluationResult = JSON.parse(jsonString);

        const scoresToLog: DBScores = {
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

