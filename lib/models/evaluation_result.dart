import 'dart:convert';

// タップ挿入用スニペット
class SnippetSuggestion {
  final String originalText;
  final String replacementText;

  SnippetSuggestion({required this.originalText, required this.replacementText});

  factory SnippetSuggestion.fromJson(Map<String, dynamic> json) {
    // String?として受け取り、nullなら空文字列をデフォルトとする
    return SnippetSuggestion(
      originalText: (json['originalText'] as String?) ?? '',
      replacementText: (json['replacementText'] as String?) ?? '',
    );
  }
}

// 評価スコアとレポートを含むメインモデル
class EvaluationResult {
  // 6軸スコア
  final int totalScore;
  final int concisenessScore;
  final int accuracyScore;
  final int clarityScore;
  final int structureScore;
  final int terminologyScore;
  final int clinicalSensitivityScore; 

  // 第三者視点レポート (定性的なフィードバック)
  final String gutReaction; 
  final String misinterpretationRisk; 
  final String impliedCompetence; 
  
  final List<SnippetSuggestion> snippetSuggestions;
  
  // ★★★ 模範解答のフィールド (今回の追加分) ★★★
  final String finalGoodChart; 

  EvaluationResult({
    required this.totalScore,
    required this.concisenessScore,
    required this.accuracyScore,
    required this.clarityScore,
    required this.structureScore,
    required this.terminologyScore,
    required this.clinicalSensitivityScore,
    required this.gutReaction,
    required this.misinterpretationRisk,
    required this.impliedCompetence,
    required this.snippetSuggestions,
    required this.finalGoodChart, // ★★★ コンストラクタに追加
  });

  factory EvaluationResult.fromJson(Map<String, dynamic> json) {
    // スニペットリストのパース
    final List<dynamic> snippetsJson = json['snippetSuggestions'] as List<dynamic>? ?? [];
    final snippets = snippetsJson.map((e) => SnippetSuggestion.fromJson(e as Map<String, dynamic>)).toList();

    // ★★★ 修正箇所: weaknessScores オブジェクトからスコアを抽出する ★★★
    final Map<String, dynamic> weaknessScores = json['weaknessScores'] as Map<String, dynamic>? ?? {};

    // 💡 エラー修正: ローカル関数から 'final' を削除
    int safeScore(String key) => (weaknessScores[key] as int?) ?? 0;

    return EvaluationResult(
      // Int fields
      totalScore: (json['totalScore'] as int?) ?? 0,
      
      // weaknessScores から各スコアを抽出
      concisenessScore: safeScore('conciseness'),
      accuracyScore: safeScore('accuracy'),
      clarityScore: safeScore('clarity'),
      structureScore: safeScore('structure'),
      terminologyScore: safeScore('terminology'),
      clinicalSensitivityScore: safeScore('clinicalSensitivity'),
      
      // String fields: nullの場合はデフォルトメッセージを返す
      gutReaction: (json['gutReaction'] as String?) ?? '評価結果がありません',
      misinterpretationRisk: (json['misinterpretationRisk'] as String?) ?? '評価結果がありません',
      impliedCompetence: (json['impliedCompetence'] as String?) ?? '評価結果がありません',

      // 模範解答のパースとデフォルト値の設定
      finalGoodChart: (json['finalGoodChart'] as String?) ?? '模範解答の生成に失敗しました。', 

      snippetSuggestions: snippets,
    );
  }

  // レーダーチャート表示用のスコアマップ
  Map<String, int> get scoreMap {
    return {
      '簡潔性': concisenessScore,
      '正確性': accuracyScore,
      '明瞭性': clarityScore,
      '構成力': structureScore,
      '医学用語': terminologyScore,
      '臨床的配慮度': clinicalSensitivityScore,
    };
  }
}