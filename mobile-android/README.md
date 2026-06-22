# OffMe Android

Native Kotlin client for OffMe — mirrors iOS core flows.

## Features

- Auth: login, signup, session restore + token refresh
- Feed: For you / Following tabs, pull-to-refresh, create post, like/repost
- Explore: user search + follow
- Bookmarks, Notifications, Messages lists
- Profile view with posts + follow

API: `https://offme.vercel.app/api/v1` (see `API_BASE_URL` in `app/build.gradle.kts`).

## Build

```bash
cd mobile-android
./gradlew :app:assembleDebug
```

Requires Android SDK + JDK 17 (Android Studio recommended).

## Structure

```
app/src/main/kotlin/com/offme/
├── data/
│   ├── api/          # Retrofit client
│   ├── auth/         # AuthStore (SharedPreferences)
│   └── models/
├── ui/
│   ├── auth/         # Login, Signup
│   ├── feed/         # FeedScreen
│   ├── explore/
│   ├── bookmarks/
│   ├── notifications/
│   ├── messages/
│   ├── profile/
│   └── components/   # BottomNavBar, PostRow, XNavIcons, …
└── util/
```