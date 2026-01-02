# MedGenesis - PharmaAuth Android App

MedGenesis is a modern Android application designed to verify the authenticity of medicine packages using QR code scanning and secure backend verification. It helps users identify counterfeit medicines by providing real-time verification and historical tracking.

## 🚀 Features

- **QR Code Scanning**: High-speed barcode and QR code scanning using CameraX and ML Kit.
- **Real-time Verification**: Securely verify medicine authentication codes with a backend API.
- **Location Awareness**: Records location data during verification to help track counterfeit distribution points.
- **Verification History**: Stores scan results locally using Room Database for offline access.
- **Statistics Dashboard**: View daily scan statistics, including authentic vs. suspicious counts.
- **Settings & Sync**: Configure API endpoints and synchronize offline scan data.

## 🛠 Tech Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose (Modern Declarative UI)
- **Architecture**: MVVM (Model-View-ViewModel)
- **Database**: Room Persistence Library
- **Networking**: Retrofit 2 & OkHttp 3
- **Scanning**: Google ML Kit Barcode Scanning & CameraX
- **Navigation**: Jetpack Navigation Compose
- **DI/Management**: Manual dependency injection via Application class

## 📋 Prerequisites

- Android Studio Iguana or newer
- JDK 21 (configured in `gradle-wrapper.properties` and `build.gradle`)
- Android SDK 34 (Compile & Target)

## ⚙️ Configuration

### Backend Setup
The app is configured to connect to a backend server. You can update the base URL in:
`app/src/main/java/com/medgenesis/pharmauth/data/repository/VerificationRepository.kt`

Default for Emulator: `http://10.0.2.2:8080`

### Google Services
If you intend to use Firebase features, you must add your `google-services.json` to the `app/` directory and uncomment the plugin in:
- Project `build.gradle`
- App `build.gradle`

## 🛠 Installation

1. Clone the repository.
2. Open the project in Android Studio.
3. Sync Project with Gradle Files.
4. Run the app on an Emulator or physical device (API Level 21+).

## 📂 Project Structure

- `data/`: Contains models, Room database, and repository logic.
- `ui/`: Contains Compose screens, components, theme, and navigation.
- `ui/viewmodel/`: Contains ViewModels for state management.
- `remote/`: API service interfaces and clients.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
