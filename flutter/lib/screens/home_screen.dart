import 'package:flutter/material.dart';
import '../widgets/safety_disclaimer.dart';
import '../widgets/safety_disclaimer.dart';

/// アプリのルートホーム画面。
/// 初回起動時に免責事項を確認するためのラッパーとして機能します。
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Scaffoldのbody全体にSafetyDisclaimerを配置し、
    // 同意状態に応じてCaseSelectionScreenに遷移させます。
    return const Scaffold(
      // AppBarはSafetyDisclaimer内の画面で提供されるため、ここでは省略
      body: SafetyDisclaimer(),
    );
  }
}
