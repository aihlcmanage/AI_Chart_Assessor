// pages/api/caseinfo.js

//import { NextApiRequest, NextApiResponse } from 'next'; 

// ダミーデータ: caseIdに対応する追加情報
// 実際には、このデータはデータベース（例: Neon DBの専用テーブル）から取得されるべきです。
const DUMMY_CASE_INFO = {
  'case_001': `【バイタルサイン】
・意識レベル: E4V5M6 (清明)
・血圧: 135/85 mmHg
・脈拍: 92回/分 (整)
・呼吸数: 20回/分
・SpO2: 95% (Room Air)
・体温: 36.8℃

【フィジカル】
・胸部: 湿性ラ音なし
・腹部: 平坦・軟、圧痛(-)
・四肢: 冷感なし

【検査値 (初診時)】
・WBC: 10,500 /μL
・CK-MB: 4.5 ng/mL (↑)
・Troponin T: 0.15 ng/mL (↑)
・胸部Xp: 心拡大なし`,
  
  'case_002': `【バイタルサイン】
・意識レベル: JCS I-2
・血圧: 155/95 mmHg
・脈拍: 55回/分 (徐脈)
・呼吸数: 24回/分 (軽度の呼吸苦)
・SpO2: 90% (Room Air)
・体温: 38.0℃

【検査値】
・Cr: 2.1 mg/dL (腎機能低下)
・BUN: 40 mg/dL
・BNP: 520 pg/mL (心不全示唆)
・K: 5.8 mEq/L (高K血症)`,
  
  'case_003': `【術後管理情報 (術後1日目)】
・バイタルサイン: 安定
・ドレーン: 術後ドレーン排出量 50ml/日 (淡血性、異常なし)
・創部: 腫脹・発赤なし
・排便/排ガス: なし
・疼痛: NRS 3/10 (内服鎮痛薬でコントロール可)
・指示: 術後3日目まで絶食。点滴維持液継続。`,
  
  // 存在しないケースIDのフォールバック
  'default': 'このケースに関するバイタルサイン、フィジカル、検査値などの追加情報は提供されていません。'
};


/**
 * ケースIDに基づいて追加情報を提供するAPIハンドラ
 * @param {object} req - NextApiRequest
 * @param {object} res - NextApiResponse
 */
export default async function handler(req, res) {
    
    // ★★★ 修正箇所: CORSヘッダーを設定 ★★★
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // ★★★ 修正箇所: ここまで ★★★

    // CORS対応 (OPTIONSリクエストの処理)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
    }

    // req.bodyからcaseIdを取得
    const { caseId } = req.body;

    if (!caseId) {
        return res.status(400).json({ message: 'Missing required field: caseId' });
    }

    try {
        // 1. ダミーデータから情報を取得
        const additionalInfo = DUMMY_CASE_INFO[caseId] || DUMMY_CASE_INFO['default'];

        // 2. 情報をJSON形式で返却
        res.status(200).json({ 
            caseId, 
            additionalInfo 
        });

    } catch (error) {
        console.error('Case Info API Error:', error);
        res.status(500).json({ message: 'Internal Server Error while fetching case info.' });
    }
}
