# Strict Auto-Open Setup (Android)

This project supports a strict auto-open mode for the speed monitor. On modern Android, background activity starts are blocked for normal apps unless privileged.

Strict mode works best when either condition is true:
- The app is the default launcher (HOME app), or
- The app is set as device owner (test/provisioned devices only)

## 1. Enable Strict Mode In App
- Open `Settings` -> `Native Speed Monitor`.
- Enable `Strict auto-open`.
- Verify privilege badges:
  - `Device Owner` should be `Yes`, or
  - `Default Launcher` should be `Yes`.

## 2. Set As Default Launcher
- In app settings page, use `Open Home App Settings`.
- Set `VelocityOS` as default Home app.

## 3. Device Owner Path (Test Device)
Warning: device-owner provisioning usually requires a fresh device/emulator user.

From host machine:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb shell dpm set-device-owner com.velocityos.dashboard/.VelocityDeviceAdminReceiver
```

Check status:

```powershell
& $adb shell dpm get-device-owner
```

Expected output includes:
- `com.velocityos.dashboard/.VelocityDeviceAdminReceiver`

## 4. Verify Monitor Runtime

```powershell
& $adb shell dumpsys activity services | Select-String "SpeedMonitorService"
```

## Notes
- If strict privileges are missing, the app posts a high-priority speed alert notification instead of forced foreground open.
- Runtime permissions still required:
  - Location (foreground + background)
  - Notifications
