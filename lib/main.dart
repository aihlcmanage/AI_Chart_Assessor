import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// プロジェクト内のスクリーンとサービスのインポート
import 'package:ai_driven_chart_risk_assessor/screens/home_screen.dart'; 
import 'package:ai_driven_chart_risk_assessor/services/api_service.dart';
// SafetyDisclaimerはHomeScreen内で使用されますが、ここではグローバルな定数を定義します。

// 💡 アプリケーション全体で使用するカラー定数を定義
const Color primaryColor = Colors.teal; // メインカラー
const Color accentColor = Colors.redAccent; // リスク警告や弱点強調などに使用

void main() {
  // アプリケーションの実行
  runApp(
    MultiProvider(
      providers: [
        // ApiServiceをシングルトンとして提供
        ChangeNotifierProvider(create: (_) => ApiService()),
      ],
      child: const ChartRiskAssessorApp(),
    ),
  );
}

class ChartRiskAssessorApp extends StatelessWidget {
  const ChartRiskAssessorApp({super.key});

  @override
  Widget build(BuildContext context) {
    // 起動時にユーザー初期化メソッドを呼び出し
    context.read<ApiService>().initializeUser();

    return MaterialApp(
      title: 'AI Chart Assessor',
      // デバッグバナーを非表示にする（製品版を想定）
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        // アプリのメインカラーをティール（Teal）に設定
        colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
        useMaterial3: true,
        // AppBarの背景色をprimaryColorに統一
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
        ),
        // Elevated Buttonのスタイルを primaryColor に統一
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
      // アプリのルートとなる画面
      home: const HomeScreen(), // 💡 HomeScreenをconstで初期化
    );
  }
}
