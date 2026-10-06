# Android Production Release Signing

To sign your production builds securely without committing passwords or keystore binary files to git, follow the configuration steps below.

---

## 1. Generate a Release Keystore

Run the following command in your terminal to generate a secure keystore file:

```bash
keytool -genkey -v -keystore release.keystore -alias alphaguard -keyalg RSA -keysize 2048 -validity 10000
```

This command will prompt you for:
1. Keystore passwords.
2. Your name, organizational unit, organization, city, state, and country code.

It generates a file named `release.keystore` in your current directory.

---

## 2. Configure Environment Variables

The `android/app/build.gradle` is configured to load signing credentials from system environment variables. Before executing a release build, set the following environment variables:

### Linux / macOS
```bash
export RELEASE_STORE_FILE="/path/to/your/release.keystore"
export RELEASE_STORE_PASSWORD="your-keystore-password"
export RELEASE_KEY_ALIAS="alphaguard"
export RELEASE_KEY_PASSWORD="your-key-password"
```

### Windows (PowerShell)
```powershell
$env:RELEASE_STORE_FILE="C:\path\to\your\release.keystore"
$env:RELEASE_STORE_PASSWORD="your-keystore-password"
$env:RELEASE_KEY_ALIAS="alphaguard"
$env:RELEASE_KEY_PASSWORD="your-key-password"
```

### Windows (CMD)
```cmd
set RELEASE_STORE_FILE=C:\path\to\your\release.keystore
set RELEASE_STORE_PASSWORD=your-keystore-password
set RELEASE_KEY_ALIAS=alphaguard
set RELEASE_KEY_PASSWORD=your-key-password
```

---

## 3. Fallback Mode (Development/Testing)

To simplify developer builds, if `RELEASE_STORE_FILE` is not set and `release.keystore` is not found in the `android/app/` folder, the build pipeline dynamically falls back to the local `debug` signing configuration. This allows you to verify that obfuscation and compilation work locally without setting up passwords.

---

## ⚠️ SECURITY WARNING

**NEVER commit `release.keystore` or plaintext passwords to version control.**
Ensure `*.keystore` and environment scripts containing credentials are listed in your `.gitignore` file.
