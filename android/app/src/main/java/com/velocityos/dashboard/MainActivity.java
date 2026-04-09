package com.velocityos.dashboard;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	private static final int SPEED_MONITOR_PERMISSION_REQUEST_CODE = 4103;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		registerPlugin(EmbeddedWebViewPlugin.class);
		registerPlugin(NativeMonitorPlugin.class);
		super.onCreate(savedInstanceState);
		ensureRuntimePermissions();
		ensureSpeedMonitorRunning();
	}

	@Override
	public void onResume() {
		super.onResume();
		ensureRuntimePermissions();
		ensureSpeedMonitorRunning();
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);
		if (requestCode == SPEED_MONITOR_PERMISSION_REQUEST_CODE) {
			ensureRuntimePermissions();
			ensureSpeedMonitorRunning();
		}
	}

	private void ensureRuntimePermissions() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
				&& ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
			ActivityCompat.requestPermissions(
					this,
					new String[]{Manifest.permission.POST_NOTIFICATIONS},
					SPEED_MONITOR_PERMISSION_REQUEST_CODE
			);
			return;
		}

		if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
				&& ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
			ActivityCompat.requestPermissions(
					this,
					new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
					SPEED_MONITOR_PERMISSION_REQUEST_CODE
			);
			return;
		}

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
				&& ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) != PackageManager.PERMISSION_GRANTED) {
			ActivityCompat.requestPermissions(
					this,
					new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION},
					SPEED_MONITOR_PERMISSION_REQUEST_CODE
			);
		}
	}

	private void ensureSpeedMonitorRunning() {
		Intent serviceIntent = new Intent(this, SpeedMonitorService.class);
		if (!MonitorPreferences.isEnabled(this)) {
			stopService(serviceIntent);
			return;
		}

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			ContextCompat.startForegroundService(this, serviceIntent);
		} else {
			startService(serviceIntent);
		}
	}
}
