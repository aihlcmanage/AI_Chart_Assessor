import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/case_model.dart';
import '../models/evaluation_result.dart';
import '../services/api_service.dart';
import '../widgets/score_visualization.dart'; // 評価スコア表示ウィジェット

class ChartInputScreen extends StatefulWidget {
  final CaseModel caseItem;

  const ChartInputScreen({super.key, required this.caseItem});

  @override
  State<ChartInputScreen> createState() => _ChartInputScreenState();
}

class _ChartInputScreenState extends State<ChartInputScreen> {
  final TextEditingController _controller = TextEditingController();
  EvaluationResult? _evaluationResult;
  bool _isLoading = false;
  // 評価モードを保持（課題のターゲットスキルに基づき設定）
  late final String _evaluationMode; 

  @override
  void initState() {
    super.initState();
    // 初期入力として元のカルテ文章を設定 (originalChart -> originalText に修正)
    _controller.text = widget.caseItem.originalText;
    
    // ターゲットスキルを評価モードとして設定
    // "臨床的配慮度"をターゲットとする場合は 'clinical_sensitivity'、それ以外は 'accuracy'
    _evaluationMode = widget.caseItem.targetSkill.toLowerCase().contains('臨床的配慮度')
        ? 'clinical_sensitivity' 
        : 'accuracy'; 
  }

  /// スニペットボタンがタップされたときに入力テキストに挿入する
  void _insertSnippet(String replacementText) {
    final currentText = _controller.text;
    final selection = _controller.selection;

    // 現在のカーソル位置にスニペットを挿入
    final newText = currentText.replaceRange(selection.start, selection.end, replacementText);

    setState(() {
      _controller.text = newText;
      // カーソルを挿入したテキストの末尾に移動
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: selection.start + replacementText.length),
      );
    });
  }

  /// AI評価を実行する
  Future<void> _evaluateChart() async {
    if (_controller.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('カルテ文章を入力してください。')),
      );
      return;
    }

    // ApiServiceを使用
    final apiService = Provider.of<ApiService>(context, listen: false);

    setState(() {
      _isLoading = true;
      _evaluationResult = null;
    });

    try {
      final result = await apiService.evaluate(
        caseId: widget.caseItem.caseId,
        fullText: _controller.text.trim(),
        evaluationMode: _evaluationMode,
        // APIの引数として必須ではないが、もしAPI側で必要であれば渡す
        caseTitle: widget.caseItem.title,
        targetSkill: widget.caseItem.targetSkill,
        originalText: widget.caseItem.originalText, // ここを originalText に修正
      );

      setState(() {
        _evaluationResult = result;
      });
    } catch (e) {
      debugPrint('評価エラー: $e');
       ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('評価エラーが発生しました: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  // スニペットと入力支援の構築
  Widget _buildInputAssistance() {
    // 評価結果がある場合は、AIが推奨するスニペット候補を表示
    if (_evaluationResult != null && _evaluationResult!.snippetSuggestions.isNotEmpty) {
      return Wrap(
        spacing: 8.0,
        runSpacing: 4.0,
        children: _evaluationResult!.snippetSuggestions.map((snippet) {
          final replacementText = snippet.replacementText; 
          
          return ActionChip(
            label: Text(replacementText, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            backgroundColor: Colors.blueAccent.shade400,
            onPressed: () => _insertSnippet(replacementText),
            tooltip: '「${snippet.originalText}」の代わりにタップ挿入',
          );
        }).toList(),
      );
    }

    // 評価前またはスニペットがない場合は定型句ボタンを表示
    final initialSnippets = ['〜を認める', '〜がみられた', '〜に矛盾しない', '〜を呈した'];
    return Wrap(
      spacing: 8.0,
      runSpacing: 4.0,
      children: initialSnippets.map((text) {
        return ActionChip(
          label: Text(text),
          onPressed: () => _insertSnippet(text),
          backgroundColor: Colors.grey.shade200,
        );
      }).toList(),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // テーマカラーの取得
    final primaryColor = Theme.of(context).colorScheme.primary;
    final accentColor = Theme.of(context).colorScheme.error; 

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.caseItem.title} - カルテ修正'),
        backgroundColor: primaryColor,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            // 1. 元のカルテ表示エリア
            const Text('元のカルテ（AI生成）:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12.0),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8.0),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: SelectableText(
                widget.caseItem.originalText, // ここを originalText に修正
                style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.black87),
              ),
            ),
            const SizedBox(height: 20),
            
            // 1.5. 課題に対するヒント
            Container(
              padding: const EdgeInsets.all(12.0),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8.0),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('💡 今回の課題のヒント', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text(
                    widget.caseItem.hintInstruction,
                    style: const TextStyle(color: Colors.black87, fontSize: 14),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. 修正入力エリア
            const Text('修正後のカルテ（入力）:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            TextField(
              controller: _controller,
              maxLines: 8,
              decoration: InputDecoration(
                hintText: 'ここに改善したカルテ文章を入力してください...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                fillColor: Colors.white,
                filled: true,
              ),
            ),
            const SizedBox(height: 10),

            // 3. 入力支援（スニペット・選択肢モード）
            _buildInputAssistance(),
            const SizedBox(height: 20),

            // 4. 評価ボタン
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isLoading ? null : _evaluateChart,
                icon: _isLoading 
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send_rounded),
                label: Text(_isLoading ? 'AIが評価中...' : 'AIに評価を依頼する', style: const TextStyle(fontSize: 18)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 5,
                ),
              ),
            ),
            const SizedBox(height: 30),

            // 5. 評価結果表示エリア
            if (_evaluationResult != null) ...[
              const Divider(),
              _buildEvaluationReport(_evaluationResult!), // 評価レポート表示関数
            ]
          ],
        ),
      ),
    );
  }

  // 評価結果表示エリア全体を構築
  Widget _buildEvaluationReport(EvaluationResult result) {
    final primaryColor = Theme.of(context).colorScheme.primary;
    final accentColor = Theme.of(context).colorScheme.error;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 総合スコア
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('総合評価', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: primaryColor)),
            Text('${result.totalScore} / 60点', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 32, color: accentColor)), // 6項目 x 10点 = 60点
          ],
        ),
        const SizedBox(height: 15),

        // 6軸スコアの視覚化（ScoreVisualizationウィジェットを使用）
        ScoreVisualization(result: result),
        
        const SizedBox(height: 20),

        // 🚨 第三者視点レポート
        const Text('🚨 専門医の第三者視点レポート', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFFE53935))),
        const SizedBox(height: 10),
        
        _buildReportSection(
          icon: Icons.flash_on, 
          title: '第一印象 (Gut Reaction)', 
          content: result.gutReaction,
          color: Colors.amber.shade700
        ),
        _buildReportSection(
          icon: Icons.warning_amber_rounded, 
          title: '誤解リスク分析 (Misinterpretation Risk)', 
          content: result.misinterpretationRisk,
          color: Colors.red.shade700
        ),
        _buildReportSection(
          icon: Icons.verified_user, 
          title: '信頼度評価 (Competence Implied)', 
          content: result.impliedCompetence,
          color: Colors.lightGreen.shade700
        ),
        
        const SizedBox(height: 20),

        // AI模範解答の表示
        _buildAiGoodChart(result.finalGoodChart),
        
        const SizedBox(height: 20),
        
        // 修正スニペットの提案 (Diff表示)
        const Text(
          'AIによる修正提案',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey),
        ),
        const Divider(),
        _buildDiffViewer(result.snippetSuggestions),

        const SizedBox(height: 40),
      ],
    );
  }

  // レポートセクションの共通構築 
  Widget _buildReportSection({required IconData icon, required String title, required String content, required Color color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(
                title, 
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)
              ),
            ],
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.all(12),
            width: double.infinity,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Text(
              content,
              style: const TextStyle(fontSize: 14, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
  
  // AI模範解答表示ウィジェット
  Widget _buildAiGoodChart(String goodChart) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'AIの模範解答 (合格点カルテ)',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green),
        ),
        const Divider(color: Colors.green),
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: Colors.green.shade200, width: 2),
          ),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12.0),
            child: Text(
              goodChart,
              style: const TextStyle(
                fontSize: 15, 
                fontFamily: 'RobotoMono', // 等幅フォントでカルテ感を出す
                height: 1.4,
                color: Colors.black87,
              ),
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.only(top: 8.0),
          child: Text(
            'この模範解答は、提出されたカルテの意図を完璧に満たすSOAP形式で記載されています。あなたの修正案と比較して、構成力と表現を学びましょう。',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ),
      ],
    );
  }

  // Diff Viewerの表示
  Widget _buildDiffViewer(List<SnippetSuggestion> suggestions) {
    if (suggestions.isEmpty) {
      return const Text('AIによる具体的な修正提案は見つかりませんでした。');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: suggestions.map((suggestion) {
        // 元のテキストに含まれていない場合はDiff表示が難しい可能性があるためスキップ
        // ここも originalChart -> originalText に修正
        if (!widget.caseItem.originalText.contains(suggestion.originalText) && !_controller.text.contains(suggestion.originalText)) {
          return const SizedBox.shrink();
        }
        
        // 修正前後の文章を作成し、DiffViewerで表示
        final originalSnippet = '【元の記載】 ${suggestion.originalText}';
        final modifiedSnippet = '【修正案】 ${suggestion.replacementText}';
        
        // DiffViewerはまだ簡易的な実装のため、一旦テキストで表示
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  originalSnippet,
                  style: TextStyle(color: Colors.red.shade700, decoration: TextDecoration.lineThrough),
                ),
                const SizedBox(height: 4),
                Text(
                  modifiedSnippet,
                  style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}