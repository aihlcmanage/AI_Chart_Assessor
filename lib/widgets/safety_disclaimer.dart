import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../screens/case_selection_screen.dart'; // メインコンテンツ画面

// -----------------------------------------------------
// 1. 免責事項の初回モーダル (同意確認)
// -----------------------------------------------------

const String _disclaimerKey = 'disclaimer_agreed';

class SafetyDisclaimer extends StatefulWidget {
  const SafetyDisclaimer({super.key});

  @override
  State<SafetyDisclaimer> createState() => _SafetyDisclaimerState();
}

class _SafetyDisclaimerState extends State<SafetyDisclaimer> {
  bool _hasAgreed = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkAgreementStatus();
  }

  /// ユーザーが既に免責事項に同意したかを確認します。
  Future<void> _checkAgreementStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final agreed = prefs.getBool(_disclaimerKey) ?? false;
    setState(() {
      _hasAgreed = agreed;
      _isLoading = false;
    });

    if (!agreed) {
      // 未同意の場合、モーダルを表示
      WidgetsBinding.instance.addPostFrameCallback((_) => _showDisclaimerModal(context));
    }
  }

  /// 同意ボタンが押された際の処理
  void _agreeAndProceed() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_disclaimerKey, true);
    setState(() {
      _hasAgreed = true;
    });
    // メインコンテンツへ遷移 (この画面を置き換える)
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const CaseSelectionScreen()),
    );
  }

  /// 免責事項モーダルの表示
  void _showDisclaimerModal(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false, // 必須同意のため閉じさせない
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text(
            '【重要】利用上の注意と免責事項', 
            style: TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.bold)
          ),
          content: const SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                Text(
                  'このアプリケーションは、医学生および研修医の学習・訓練を目的としたツールです。',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 12),
                Text('1. 実際の診療行為への使用禁止:'),
                Text('   AIによる評価結果や修正提案を、患者の診断、治療、実際のカルテ記載に直接使用することは絶対にできません。'),
                SizedBox(height: 8),
                Text('2. 専門医の監修なし:'),
                Text('   本サービスの情報は専門医や指導医による最終的な監修を受けていません。常に、あなた自身の医療知識と指導医の指示に基づいて判断してください。'),
                SizedBox(height: 8),
                Text('3. 免責事項:'),
                Text('   本アプリの利用により生じた損害や、誤った医療行為に基づく結果について、当サービスは一切の責任を負いません。'),
              ],
            ),
          ),
          actions: <Widget>[
            Center(
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                  _agreeAndProceed(); // 同意して次に進む
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935), // 赤で強調
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                child: const Text('上記免責事項に同意し、学習ツールとして使用します'),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    // 同意済みであれば、直接メイン画面を表示
    if (_hasAgreed) {
      // Navigatorで既にCaseSelectionScreenに遷移しているため、ここでは単純なSizedBoxを返す
      // main.dartのSafetyDisclaimerWrapperの役割と合わせて、画面が重複しないようにする
      return const CaseSelectionScreen();
    }
    
    // 未同意だがモーダルが表示されている状態 (このウィジェット自体は空でOK)
    return const Scaffold(
      body: Center(
        child: Text('利用規約を確認中...', style: TextStyle(color: Colors.grey)),
      ),
    );
  }
}

// -----------------------------------------------------
// 2. 永続的な警告フッター (全画面に表示)
// -----------------------------------------------------

class PermanentWarningFooter extends StatelessWidget {
  const PermanentWarningFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      color: Colors.yellow[100], // 薄い黄色背景
      width: double.infinity,
      child: const Text(
        '⚠ 注意：これは学習用ツールであり、実際の診療・診断には使用できません。',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: Colors.black87,
          fontSize: 10,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
