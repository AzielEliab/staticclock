# StaticClock on iPhone and Android

Record an action on this phone. The list grows while the app is open.

**Author:** Aziel Eliab

## Start

```bash
cd mobile
flutter create --org com.azieeliab --project-name staticclock .
flutter pub get
flutter run
```

Press **Record action**. AZ-OS and the companion advisory are under **Advanced**. The theme follows the system light and dark setting. Gold marks the focused control.

Application id: `com.azieeliab.staticclock`. Offline.

The `android/` and `ios/` folders are skeleton READMEs until `flutter create .` runs. Then open `android/` in Android Studio or `ios/Runner.xcworkspace` in Xcode.

## Desktop timeline

The phone list does not replace the desktop package. On a computer:

```bash
staticclock ui
```

Open http://127.0.0.1:8765/

Counted archive: https://staticclock-download-tracker.vibelock.workers.dev/  
GitHub: https://github.com/AzielEliab/staticclock

Forks are welcome and always allowed.
