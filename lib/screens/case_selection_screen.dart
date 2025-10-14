import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/case_model.dart';
import '../services/api_service.dart';
import '../widgets/safety_disclaimer.dart';
import 'chart_input_screen.dart'; 

/// ユーザーが取り組むべきカルテ課題のリストを表示する画面
class CaseSelectionScreen extends StatefulWidget {
  const CaseSelectionScreen({super.key});

  @override
  State<CaseSelectionScreen> createState() => _CaseSelectionScreenState();
}

class _CaseSelectionScreenState extends State<CaseSelectionScreen> {
  List<CaseModel> _caseList = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    // 画面ロード時に課題リストの取得を開始
    _fetchCaseList();
  }

  /// APIから課題リストを取得する
  Future<void> _fetchCaseList() async {
    // 初期のsetStateは安全
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // ApiServiceからgetCaseList()を呼び出す
      final apiService = Provider.of<ApiService>(context, listen: false);
      final fetchedList = await apiService.getCaseList();
      
      // 🚨 修正: setStateを呼ぶ前にmountedをチェック
      if (mounted) {
        setState(() {
          _caseList = fetchedList;
        });
      }
    } catch (e) {
      // 🚨 修正: mountedをチェック
      if (mounted) {
        setState(() {
          _error = '課題の取得中にエラーが発生しました: $e';
        });
      }
      debugPrint('Error fetching case list: $e');
    } finally {
      // 🚨 修正: mountedをチェック
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  /// 選択された課題の入力画面へ遷移する
  void _navigateToChartInput(CaseModel caseModel) {
    Navigator.of(context).push(
      MaterialPageRoute(
        // ChartInputScreenをウィジェットとして正しく使用
        builder: (context) => ChartInputScreen(caseItem: caseModel),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // テーマカラーの取得
    final primaryColor = Theme.of(context).colorScheme.primary;
    final accentColor = Theme.of(context).colorScheme.error;

    return Scaffold(
      appBar: AppBar(
        title: const Text('カルテ添削課題の選択'),
        backgroundColor: primaryColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _fetchCaseList,
            tooltip: '課題リストを更新',
          ),
        ],
      ),
      body: Stack(
        children: [
          _buildBody(primaryColor, accentColor),
          // 永続的な注意書きフッター
          const Align(
            alignment: Alignment.bottomCenter,
            child: PermanentWarningFooter(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(Color primaryColor, Color accentColor) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.warning_amber_rounded, color: accentColor, size: 40),
              const SizedBox(height: 10),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(color: accentColor),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _fetchCaseList,
                // テーマに沿ったボタン
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor, 
                  foregroundColor: Colors.white,
                ),
                child: const Text('再試行'),
              )
            ],
          ),
        ),
      );
    }

    if (_caseList.isEmpty) {
      return const Center(
        child: Text('現在、利用可能な課題がありません。', style: TextStyle(fontSize: 16, color: Colors.grey)),
      );
    }

    return ListView.builder(
      // PermanentWarningFooterの高さ分、下部にパディングを追加
      padding: const EdgeInsets.only(bottom: 50.0), 
      itemCount: _caseList.length,
      itemBuilder: (context, index) {
        final caseItem = _caseList[index];
        return Card(
          elevation: 2,
          margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: ListTile(
            leading: Icon(Icons.assignment, color: primaryColor),
            title: Text(
              caseItem.title, 
              style: const TextStyle(fontWeight: FontWeight.bold)
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text('ターゲットスキル: ${caseItem.targetSkill}'),
                Text(
                  caseItem.hintInstruction,
                  style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.black54, fontSize: 13),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            trailing: Icon(Icons.chevron_right, color: Colors.grey.shade400),
            onTap: () => _navigateToChartInput(caseItem),
          ),
        );
      },
    );
  }
}