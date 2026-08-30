import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF07070C),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const KA2HeavenApp());
}

class KA2HeavenApp extends StatelessWidget {
  const KA2HeavenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KA² — HEAVEN',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF07070C),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFF4F81),
          secondary: Color(0xFF9B5CFF),
          surface: Color(0xFF101019),
        ),
      ),
      home: const KA2WebViewScreen(),
    );
  }
}

class KA2WebViewScreen extends StatefulWidget {
  const KA2WebViewScreen({super.key});

  @override
  State<KA2WebViewScreen> createState() => _KA2WebViewScreenState();
}

class _KA2WebViewScreenState extends State<KA2WebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _progress = 0;

  static const String liveAppUrl = 'https://ka2-heaven.vercel.app';

  @override
  void initState() {
    super.initState();
    _requestPermissions();
    _initWebView();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.camera,
      Permission.microphone,
      Permission.storage,
      Permission.photos,
      Permission.notification,
    ].request();
  }

  void _initWebView() {
    final WebViewController controller = WebViewController();

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF07070C))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            setState(() {
              _progress = progress / 100;
            });
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebView Error: ${error.description}');
          },
        ),
      );

    // Android WebRTC & Camera/Mic Permission Granting
    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(false);
      final androidController = controller.platform as AndroidWebViewController;
      
      androidController.setMediaPlaybackRequiresUserGesture(false);
      androidController.setOnPlatformPermissionRequest((request) {
        request.grant();
      });
    }

    controller.loadRequest(Uri.parse(liveAppUrl));
    _controller = controller;
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (await _controller.canGoBack()) {
          _controller.goBack();
          return false;
        }
        return true;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF07070C),
        body: SafeArea(
          bottom: true,
          top: false,
          child: Stack(
            children: [
              // Main WebView
              WebViewWidget(controller: _controller),

              // Top Loading Bar
              if (_isLoading && _progress < 1.0)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _progress,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFF4F81)),
                    minHeight: 2.5,
                  ),
                ),

              // Cinematic Romantic Splash Loading Overlay
              if (_isLoading && _progress < 0.3)
                Container(
                  color: const Color(0xFF07070C),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              colors: [Color(0xFF9B5CFF), Color(0xFFFF4F81)],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF4F81).withOpacity(0.4),
                                blurRadius: 24,
                                spreadRadius: 4,
                              )
                            ],
                          ),
                          child: const Center(
                            child: Text(
                              'KA²',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 24,
                                letterSpacing: -0.5,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'KA² — HEAVEN',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          '“A Heaven Made for Two.”',
                          style: TextStyle(
                            color: Color(0xFFFF91B5),
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        const SizedBox(height: 32),
                        const SpinKitThreeBounce(
                          color: Color(0xFFFF4F81),
                          size: 24.0,
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
