## VelocityOS Release Assets

- `velocityos-android-release.apk`: Signed Android release APK for direct sideload installs.
- `velocityos-android-release.aab`: Signed Android App Bundle for Google Play Console upload.
- `velocityos-android-debug.apk`: Debug APK for internal device testing and troubleshooting.
- `velocityos-web-client.zip`: Production web client bundle built from `dist/client`.
- `velocityos-worker-bundle.zip`: Cloudflare Worker bundle built from `dist/velocity_os_ajk22f0pbdwn_plihcfqc`.
- `SHA256SUMS.txt`: SHA-256 checksums for validating the uploaded release assets.

## Notes

- The Android release APK and AAB are signed with the local upload keystore configured for this workspace.
- The debug APK is not intended for Play upload or public release distribution.