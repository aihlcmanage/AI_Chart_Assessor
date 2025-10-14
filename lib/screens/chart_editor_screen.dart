import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/case_model.dart';
import '../services/api_service.dart';
import '../models/evaluation_result.dart';
import '../widgets/safety_disclaimer.dart';
import '../main.dart'; // primaryColor
import '../widgets/score_visualization.dart'; // スコア可視化ウィジェットをインポート

class ChartEditorScreen extends StatefulWidget {
  final CaseModel caseModel;

  const ChartEditorScreen({super.key, required this.caseModel});

  @override
  State<ChartEditorScreen> createState() => _ChartEditorScreenState();
}

class _ChartEditorScreenState extends State<ChartEditorScreen> {
  late TextEditingController _controller;
  EvaluationResult? _evaluationResult;
  bool _isEvaluating = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    // 初期カルテ内容をコントローラに設定
    _controller = TextEditingController(text: widget.caseModel.originalText);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// 修正済みカルテを評価のためにAPIに送信する
  void _submitEvaluation() async {
    if (_controller.text.trim().isEmpty) {
      setState(() => _errorMessage = 'カルテ本文が空です。修正内容を入力してください。');
      return;
    }

    setState(() {
      _isEvaluating = true;
      _errorMessage = '';
      _evaluationResult = null;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final result = await apiService.evaluate(
        caseId: widget.caseModel.caseId,
        fullText: _controller.text,
        evaluationMode: 'full', // 今回はフル評価のみ
        // ★★★ 🚨 修正点: 必須引数をCaseModelから渡すように修正 🚨 ★★★
        caseTitle: widget.caseModel.title,
        targetSkill: widget.caseModel.targetSkill,
        originalText: widget.caseModel.originalText,
        // ★★★ 🚨 修正完了 🚨 ★★★
      );

      setState(() {
        _evaluationResult = result;
      });
      // 評価結果パネルを表示
      _showEvaluationResultPanel(context, result);
    } catch (e) {
      setState(() {
        // APIエラーメッセージを整形して表示
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        // 429 エラーメッセージの特殊処理 (API利用制限)
        if (_errorMessage.contains('429')) {
             _errorMessage = '本日のAI評価利用制限(1,500回/日)に達しました。明日またお試しください。';
        }
      });
    } finally {
      setState(() {
        _isEvaluating = false;
      });
    }
  }

  /// 評価結果をモーダルパネルで表示する
  void _showEvaluationResultPanel(BuildContext context, EvaluationResult result) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) {
        return EvaluationResultPanel(
          result: result,
          caseModel: widget.caseModel,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.caseModel.title),
      ),
      body: Column(
        children: [
          // 課題タイトルとヒントセクション
          Container(
            padding: const EdgeInsets.all(16),
            width: double.infinity,
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ターゲットスキル: ${widget.caseModel.targetSkill}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: primaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '💡 ヒント: ${widget.caseModel.hintInstruction}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      maxLines: null, // 無制限の行数
                      expands: true, // 縦方向に広がる
                      textAlignVertical: TextAlignVertical.top,
                      decoration: const InputDecoration(
                        hintText: 'ここに修正後のカルテ本文を入力してください...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                      ),
                    ),
                  ),
                  
                  if (_errorMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(_errorMessage, style: const TextStyle(color: accentColor, fontWeight: FontWeight.bold)),
                    ),
                  
                  const SizedBox(height: 20),
                  
                  // 評価実行ボタン
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      // 以前のコードでは onPressed が常に実行されており、これがエラーの原因の可能性があります。
                      // ここでは _isEvaluating ? null : _submitEvaluation でボタンの有効/無効を制御する以外に、
                      // 評価処理自体がどこからも自動実行されないことを確認します。
                      onPressed: _isEvaluating ? null : _submitEvaluation,
                      icon: _isEvaluating 
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Icon(Icons.check_circle_outline),
                      label: Text(_isEvaluating ? 'AI評価中...' : '修正カルテを評価する'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        textStyle: const TextStyle(fontSize: 18),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // 永続的な警告フッター
          const PermanentWarningFooter(),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------------
// 評価結果パネル (EvaluationResultPanel)
// ------------------------------------------------------------------

class EvaluationResultPanel extends StatelessWidget {
  final EvaluationResult result;
  final CaseModel caseModel;

  const EvaluationResultPanel({super.key, required this.result, required this.caseModel});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false, // 閉じるボタンはBottomで用意
          title: const Text('AI評価レポート'),
          backgroundColor: primaryColor,
          toolbarHeight: 50,
          bottom: const TabBar(
            tabs: [
              Tab(text: '🚨 第三者視点サマリー'),
              Tab(text: '📊 スコア詳細'),
            ],
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            indicatorColor: Colors.white,
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: TabBarView(
                children: [
                  // Tab 1: 第三者視点レポート (最も重要なフィードバック)
                  _buildSummaryTab(context),
                  
                  // Tab 2: スコア詳細（レーダーチャート）
                  ScoreVisualization(result: result), // 💡 修正: 正しいウィジェット参照
                ],
              ),
            ),
            
            // 閉じるボタンと次のアクション
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context); // パネルを閉じる
                        Navigator.pop(context); // エディタ画面を閉じて課題選択画面に戻る
                      },
                      child: const Text('課題選択に戻る'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 第三者視点レポート (Tab 1) の実装
  Widget _buildSummaryTab(BuildContext context) {
    // 臨床的配慮度スコアに応じて色を決定
    Color riskColor = result.clinicalSensitivityScore < 5 ? accentColor : (result.clinicalSensitivityScore < 8 ? Colors.orange : Colors.green);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 危険度ハイライト
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: riskColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: riskColor, width: 2),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.warning, color: riskColor, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '臨床的配慮度スコア: ${result.clinicalSensitivityScore} / 10点',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: riskColor),
                      ),
                      if (result.clinicalSensitivityScore < 8)
                        const Text(
                          'このスコアは、あなたの文章が**読む医師に誤解を与えるリスク**が高いことを示しています。',
                          style: TextStyle(fontSize: 14),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Text('✅ 総合点', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Text(
            '${result.totalScore} 点',
            style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: primaryColor),
          ),
          
          const Divider(height: 30),

          // 専門医の第一印象
          _buildReportSection(
            icon: Icons.person_pin,
            title: '👓 読む専門医の第一印象 (Gut Reaction)',
            content: result.gutReaction,
            iconColor: Colors.blueGrey,
          ),
          
          // 誤解リスク分析
          _buildReportSection(
            icon: Icons.dangerous,
            title: '🔴 誤解リスク分析 (Misinterpretation Risk)',
            content: result.misinterpretationRisk,
            iconColor: accentColor,
          ),

          // 信頼度評価
          _buildReportSection(
            icon: Icons.star_half,
            title: '✍️ 信頼度への影響 (Competence Implied)',
            content: result.impliedCompetence,
            iconColor: Colors.deepPurple,
          ),

          const Divider(height: 30),
          
          // 修正スニペット (改善例として表示)
          const Text('✨ 改善のための推奨スニペット', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ...result.snippetSuggestions.map((snippet) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              color: Colors.white,
              elevation: 2,
              child: ListTile(
                leading: const Icon(Icons.lightbulb_outline, color: Colors.orange),
                title: Text(snippet.replacementText, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('（元の表現: ${snippet.originalText}）', style: const TextStyle(fontSize: 12)),
              ),
            ),
          )).toList(),
        ],
      ),
    );
  }

  // レポートの各セクションを構築するヘルパーメソッド
  Widget _buildReportSection({required IconData icon, required String title, required String content, required Color iconColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              content,
              style: const TextStyle(fontSize: 15, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
