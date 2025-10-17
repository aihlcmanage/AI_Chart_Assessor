import 'package:flutter/material.dart';
import '../models/evaluation_result.dart';

// main.dartで定義されているカラー定数と合わせるためのローカル定義
// 実際にはTheme.of(context)から取得することが望ましいですが、
// ウィジェット単体でプレビュー可能にするためにローカル定数を保持します。
const Color _primaryColor = Colors.teal;
const Color _accentColor = Colors.redAccent;

/// 6軸評価スコアを視覚的に表示するウィジェット
/// （詳細なスコアバー表示）
class ScoreVisualization extends StatelessWidget {
  final EvaluationResult result;

  const ScoreVisualization({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    // EvaluationResultのscoreMapを取得
    final scores = result.scoreMap;
    
    // スコアのキーをリスト化し、特に重要な「臨床的配慮度」を最初に表示するためソート
    final sortedKeys = scores.keys.toList()..sort((a, b) {
      if (a == '臨床的配慮度') return -1;
      if (b == '臨床的配慮度') return 1;
      return 0;
    });

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.symmetric(vertical: 10),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '6軸評価スコア (10点満点)',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: _primaryColor,
              ),
            ),
            const Divider(height: 20),
            
            // スコアバーリスト
            ...sortedKeys.map((key) {
              final score = scores[key] ?? 0;
              return _ScoreBar(
                label: key,
                score: score,
                isKeyMetric: key == '臨床的配慮度',
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
}

/// 各評価項目のスコアバーウィジェット
class _ScoreBar extends StatelessWidget {
  final String label;
  final int score;
  final bool isKeyMetric; // 臨床的配慮度などの重要指標フラグ

  const _ScoreBar({
    required this.label,
    required this.score,
    this.isKeyMetric = false,
  });

  // スコアに基づいた色を取得 (8点以上:緑, 5点以上:黄, 5点未満:赤)
  Color _getScoreColor(int score) {
    if (score >= 8) return Colors.green.shade600;
    if (score >= 5) return Colors.amber.shade700;
    return _accentColor; // 5点未満は赤
  }

  @override
  Widget build(BuildContext context) {
    // 10点満点のスコアバー
    final double percentage = score / 10.0;
    final Color scoreColor = _getScoreColor(score);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          // ラベル
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: isKeyMetric ? FontWeight.w900 : FontWeight.w500,
                // 最重要指標である「臨床的配慮度」を強調
                color: isKeyMetric ? _accentColor : Colors.black87, 
                fontSize: isKeyMetric ? 15 : 14,
              ),
            ),
          ),
          
          // プログレスバー
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(5),
              child: LinearProgressIndicator(
                value: percentage,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
                minHeight: 12,
              ),
            ),
          ),
          
          // スコア値
          SizedBox(
            width: 40,
            child: Text(
              ' $score',
              textAlign: TextAlign.right,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: scoreColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
