// lib/models/case_model.dart

/// ユーザーが取り組むカルテ課題の情報を持つモデル
class CaseModel {
  final String caseId;
  final String title;
  final String targetSkill; // 弱点ターゲットモードで利用 (例: '臨床的配慮度')
  final String originalText; // ユーザーが修正すべき初期カルテ本文
  final String hintInstruction; // 課題に対する具体的なヒント

  CaseModel({
    required this.caseId,
    required this.title,
    required this.targetSkill,
    required this.originalText,
    required this.hintInstruction,
  });

  // Next.js APIから取得する際のファクトリコンストラクタ
  factory CaseModel.fromJson(Map<String, dynamic> json) {
    // APIがnullを返した場合に備えて、?? '' (空文字列)で代替するように修正。
    return CaseModel(
      caseId: (json['caseId'] as String?) ?? 'no_id', // String?として受け取り、nullなら'no_id'
      title: (json['title'] as String?) ?? '課題タイトルなし',
      targetSkill: (json['targetSkill'] as String?) ?? 'N/A',
      originalText: (json['originalText'] as String?) ?? '',
      hintInstruction: (json['hintInstruction'] as String?) ?? 'ヒントなし',
    );
  }
}