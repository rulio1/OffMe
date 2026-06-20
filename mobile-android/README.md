# Pulse Android

Native Kotlin client for Pulse.

## Architecture

- **Networking**: OkHttp + Retrofit, JWT auth interceptor
- **Realtime**: OkHttp WebSocket for live timeline updates
- **UI**: Jetpack Compose with Material 3 dark theme
- **Offline**: Room DB for timeline cache

## Planned Structure

```
app/src/main/kotlin/com/pulse/
├── ui/
│   ├── feed/
│   ├── composer/
│   ├── profile/
│   └── explore/
├── data/
│   ├── api/
│   ├── repository/
│   └── local/
└── domain/
    └── model/
```

## API Base URL

`BuildConfig.API_URL = "http://10.0.2.2:8080/api/v1"` (emulator → host)