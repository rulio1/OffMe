# Pulse iOS

Native Swift client for Pulse.

## Architecture

- **Networking**: URLSession with HTTP/2, JWT auth interceptor
- **Realtime**: URLSessionWebSocketTask for live timeline updates
- **Timeline**: UICollectionView compositional layout (or SwiftUI List)
- **Offline**: Core Data cache for last-fetched timeline segment

## Planned Structure

```
Pulse/
├── App/
├── Features/
│   ├── Feed/
│   ├── Composer/
│   ├── Profile/
│   ├── Notifications/
│   └── Search/
├── Core/
│   ├── API/
│   ├── Models/
│   └── Realtime/
└── Resources/
```

## API Base URL

Configure `PULSE_API_URL` in `Info.plist` → `http://localhost:8080/api/v1`