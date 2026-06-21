# OffMe Android

Native Kotlin client for OffMe.

## Status

Scaffold funcional — `MainActivity` + `MainScreen` com `BottomNavBar` (ícones estilo X).
API base configurável em `app/build.gradle.kts` (`API_BASE_URL`, padrão emulador → `10.0.2.2:3000`).

```bash
cd mobile-android
./gradlew :app:assembleDebug
```

## Planned structure

```
app/src/main/kotlin/com/offme/
├── ui/
├── data/
└── domain/
```