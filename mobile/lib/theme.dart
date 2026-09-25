import 'package:flutter/material.dart';

/// System light and dark. Gold focus. Author Aziel Eliab.
const Color kGold = Color(0xFFC9A227);
const Color kInk = Color(0xFF1C1916);
const Color kPaper = Color(0xFFF7F4EE);
const Color kMatteBlack = Color(0xFF12110F);
const Color kIvory = Color(0xFFF3EFE6);

ThemeData buildLightTheme() => _theme(
      ColorScheme.light(
        primary: kGold,
        onPrimary: kInk,
        secondary: kGold,
        onSecondary: kInk,
        surface: const Color(0xFFFFFFFF),
        onSurface: kInk,
        error: const Color(0xFF8C2F2F),
        onError: kIvory,
      ),
      kPaper,
      kInk,
    );

ThemeData buildDarkTheme() => _theme(
      ColorScheme.dark(
        primary: kGold,
        onPrimary: kInk,
        secondary: kGold,
        onSecondary: kIvory,
        surface: const Color(0xFF1C1B18),
        onSurface: kIvory,
        error: const Color(0xFFF0B4B4),
        onError: kMatteBlack,
      ),
      kMatteBlack,
      kIvory,
    );

/// Kept for callers that still ask for one theme. The app uses system light and dark.
ThemeData buildAppTheme() => buildDarkTheme();

ThemeData _theme(ColorScheme scheme, Color paper, Color ink) {
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: ink.withOpacity(0.25)),
  );
  return ThemeData(
    useMaterial3: true,
    brightness: scheme.brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: paper,
    focusColor: kGold,
    appBarTheme: AppBarTheme(
      backgroundColor: paper,
      foregroundColor: ink,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: scheme.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: ink.withOpacity(0.12)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: scheme.surface,
      border: border,
      enabledBorder: border,
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: kGold, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: scheme.brightness == Brightness.dark ? kIvory : kInk,
        foregroundColor: scheme.brightness == Brightness.dark ? kMatteBlack : kPaper,
        minimumSize: const Size.fromHeight(48),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
    ),
  );
}
