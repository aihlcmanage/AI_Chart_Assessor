"use strict";(()=>{var e={};e.id=319,e.ids=[319],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,n){return n in t?t[n]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,n)):"function"==typeof t&&"default"===n?t:void 0}}})},7003:(e,t,n)=>{n.r(t),n.d(t,{config:()=>l,default:()=>u,routeModule:()=>c});var r={};n.r(r),n.d(r,{default:()=>d});var o=n(1802),s=n(7153),a=n(6249);let i={case_001:`【バイタルサイン】
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
・胸部Xp: 心拡大なし`,case_002:`【バイタルサイン】
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
・K: 5.8 mEq/L (高K血症)`,case_003:`【術後管理情報 (術後1日目)】
・バイタルサイン: 安定
・ドレーン: 術後ドレーン排出量 50ml/日 (淡血性、異常なし)
・創部: 腫脹・発赤なし
・排便/排ガス: なし
・疼痛: NRS 3/10 (内服鎮痛薬でコントロール可)
・指示: 術後3日目まで絶食。点滴維持液継続。`,default:"このケースに関するバイタルサイン、フィジカル、検査値などの追加情報は提供されていません。"};async function d(e,t){if(t.setHeader("Access-Control-Allow-Origin","*"),t.setHeader("Access-Control-Allow-Methods","POST, OPTIONS"),t.setHeader("Access-Control-Allow-Headers","Content-Type"),"OPTIONS"===e.method){t.status(200).end();return}if("POST"!==e.method)return t.status(405).json({message:"Method Not Allowed. Use POST."});let{caseId:n}=e.body;if(!n)return t.status(400).json({message:"Missing required field: caseId"});try{let e=i[n]||i.default;t.status(200).json({caseId:n,additionalInfo:e})}catch(e){console.error("Case Info API Error:",e),t.status(500).json({message:"Internal Server Error while fetching case info."})}}let u=(0,a.l)(r,"default"),l=(0,a.l)(r,"config"),c=new o.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/caseinfo",pathname:"/api/caseinfo",bundlePath:"",filename:""},userland:r})},7153:(e,t)=>{var n;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return n}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(n||(n={}))},1802:(e,t,n)=>{e.exports=n(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var n=t(t.s=7003);module.exports=n})();