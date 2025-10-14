// lib/services/api_service.dart

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/case_model.dart';
import '../models/evaluation_result.dart';

// ---------------------------------------------------------------------------------
// ★★★ 🚨 ここにあなたのNext.js APIのデプロイURLを設定してください 🚨 ★★★
// 例: https://ai-chart-assessor.vercel.app
const String _apiBaseUrl = 'https://ai-chart-assessor.vercel.app'; 
// ---------------------------------------------------------------------------------

class ApiService extends ChangeNotifier {
  String? _userId;
  String? get userId => _userId;

  /// ユーザーIDを初期化し、永続化する
  Future<void> initializeUser() async {
    final prefs = await SharedPreferences.getInstance();
    _userId = prefs.getString('userId');

    if (_userId == null) {
      // IDがない場合は現在時刻をベースに新しいIDを生成
      _userId = DateTime.now().millisecondsSinceEpoch.toString(); 
      await prefs.setString('userId', _userId!);
    }
    notifyListeners();
    debugPrint('User initialized with ID: $_userId');
  }

  /// 課題リストを取得するメソッド
  Future<List<CaseModel>> getCaseList() async {
    if (_userId == null) {
      throw Exception("User not initialized. Please call initializeUser() first.");
    }

    final url = Uri.parse('$_apiBaseUrl/api/cases?user_id=$_userId');
    debugPrint('[DEBUG] CASE LIST API URL: $url');

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonString = utf8.decode(response.bodyBytes);
        final List<dynamic> jsonList = json.decode(jsonString);
        return jsonList.map((json) => CaseModel.fromJson(json)).toList();
      } else {
        debugPrint('API Error Status (getCaseList): ${response.statusCode}');
        debugPrint('API Error Body (getCaseList): ${response.body}');
        throw Exception(
          '課題リスト取得失敗: ステータスコード ${response.statusCode}'
        );
      }
    } catch (e) {
      debugPrint('Network or Parsing Error (getCaseList): $e');
      throw Exception('ネットワークエラーが発生しました: $e');
    }
  }

  /// 評価リクエストを送信
  Future<EvaluationResult> evaluate({
    required String caseId,
    required String fullText,
    required String evaluationMode,
    required String caseTitle, 
    required String targetSkill, 
    required String originalText,
  }) async {
    if (_userId == null) {
      throw Exception("User not initialized. Cannot proceed with API call.");
    }

    final url = Uri.parse('$_apiBaseUrl/api/evaluate');
    debugPrint('[DEBUG] EVALUATE API URL: $url');

    final headers = {'Content-Type': 'application/json'};
    final body = json.encode({
      'user_id': _userId,
      'caseId': caseId,
      'fullText': fullText, 
      'evaluationMode': evaluationMode,
      'caseTitle': caseTitle,
      'targetSkill': targetSkill,
      'originalText': originalText,
    });

    try {
      final response = await http.post(url, headers: headers, body: body);

      if (response.statusCode == 200) {
        final jsonString = utf8.decode(response.bodyBytes);
        final Map<String, dynamic> data = json.decode(jsonString);
        return EvaluationResult.fromJson(data);
      } else {
        // APIエラー時の詳細なデバッグ情報
        debugPrint('API Error Status: ${response.statusCode}');
        debugPrint('API Error Body: ${response.body}');
        throw Exception(
          'APIリクエスト失敗: ステータスコード ${response.statusCode}'
        );
      }
    } catch (e) {
      // ネットワーク/パースエラー時の詳細なデバッグ情報
      debugPrint('Network or Parsing Error: $e');
      throw Exception('ネットワークエラーが発生しました: $e');
    }
  }

  /// 💡 追加: ケースIDに基づいて追加情報（バイタルサインなど）を取得する
  Future<String> fetchCaseAdditionalInfo({required String caseId}) async {
    final url = Uri.parse('$_apiBaseUrl/api/caseinfo'); 
    debugPrint('[DEBUG] CASE INFO API URL: $url');
    
    final headers = {'Content-Type': 'application/json'};
    final body = json.encode({'caseId': caseId});

    try {
      final response = await http.post(
        url,
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(utf8.decode(response.bodyBytes));
        // バックエンドが 'additionalInfo' というキーで情報全体を返すことを想定
        final info = jsonResponse['additionalInfo'] as String? ?? '追加情報がありません。'; 
        return info;
      } else {
        debugPrint('API Error Status (fetchCaseAdditionalInfo): ${response.statusCode}');
        debugPrint('API Error Body (fetchCaseAdditionalInfo): ${response.body}');
        throw Exception(
          '追加情報のロードに失敗しました: ステータスコード ${response.statusCode}'
        );
      }
    } catch (e) {
      debugPrint('Network or Parsing Error (fetchCaseAdditionalInfo): $e');
      throw Exception('ネットワークエラーが発生しました: $e');
    }
  }
}
