package com.velocityos.dashboard;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	private static final int SPEED_MONITOR_PERMISSION_REQUEST_CODE = 4103;
	private static volatile boolean appVisible = false;
	private boolean startupPermissionRequestInFlight = false;
	private boolean startupPermissionsRequestedOnce = false;

	public static boolean isAppVisible() {
		return appVisible;
	}

	@Override
	public void onCreate(Bundle savedInstanceState) {
		registerPlugin(EmbeddedWebViewPlugin.class);
		registerPlugin(NativeMonitorPlugin.class);
		registerPlugin(NativeTtsPlugin.class);
		super.onCreate(savedInstanceState);
		applyImmersiveMode();
		SpeedMonitorService.dismissAlertNotification(this);
		ensureRuntimePermissions();
		ensureSpeedMonitorRunning();
	}

	@Override
	public void onStart() {
		super.onStart();
		appVisible = true;
		SpeedMonitorService.dismissAlertNotification(this);
	}

	@Override
	public void onResume() {
		super.onResume();
		appVisible = true;
		applyImmersiveMode();
		SpeedMonitorService.dismissAlertNotification(this);
		ensureRuntimePermissions();
		ensureSpeedMonitorRunning();
	}

	@Override
	public void onStop() {
		appVisible = false;
		super.onStop();
	}

	@Override
	public void onDestroy() {
		appVisible = false;
		super.onDestroy();
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) {
			applyImmersiveMode();
		}
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);
		if (requestCode == SPEED_MONITOR_PERMISSION_REQUEST_CODE) {
			startupPermissionRequestInFlight = false;
			ensureSpeedMonitorRunning();
		}
	}

	private void ensureRuntimePermissions() {
		if (startupPermissionRequestInFlight || startupPermissionsRequestedOnce) {
			return;
		}

		String[] missingPermissions = getMissingStartupPermissions();
		if (missingPermissions.length == 0) {
			return;
		}

		startupPermissionRequestInFlight = true;
		startupPermissionsRequestedOnce = true;
		ActivityCompat.requestPermissions(
				this,
				missingPermissions,
				SPEED_MONITOR_PERMISSION_REQUEST_CODE
		);
	}

	private String[] getMissingStartupPermissions() {
		List<String> missingPermissions = new ArrayList<>();

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
				&& ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
			missingPermissions.add(Manifest.permission.POST_NOTIFICATIONS);
		}

		if (!hasLocationPermission()) {
			missingPermissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
		}

		return missingPermissions.toArray(new String[0]);
	}

	private boolean hasPendingStartupPermissions() {
		return getMissingStartupPermissions().length > 0;
	}

	private boolean hasLocationPermission() {
		return ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
				|| ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
	}

	private void applyImmersiveMode() {
		Window window = getWindow();
		if (window == null) {
			return;
		}

		WindowCompat.setDecorFitsSystemWindows(window, false);
		window.setStatusBarColor(Color.TRANSPARENT);
		window.setNavigationBarColor(Color.TRANSPARENT);

		WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
		if (controller == null) {
			return;
		}

		controller.hide(WindowInsetsCompat.Type.systemBars());
		controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
	}

	private void ensureSpeedMonitorRunning() {
		Intent serviceIntent = new Intent(this, SpeedMonitorService.class);
		if (!MonitorPreferences.isEnabled(this)) {
			stopService(serviceIntent);
			SpeedMonitorService.dismissAlertNotification(this);
			return;
		}

		if (startupPermissionRequestInFlight || hasPendingStartupPermissions() || !hasLocationPermission()) {
			return;
		}

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			ContextCompat.startForegroundService(this, serviceIntent);
		} else {
			startService(serviceIntent);
		}
	}
}
