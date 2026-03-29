package com.velocityos.dashboard;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeMonitor")
public class NativeMonitorPlugin extends Plugin {
    private static final int MONITOR_PLUGIN_PERMISSION_REQUEST_CODE = 4104;

    @PluginMethod
    public void getConfig(PluginCall call) {
        call.resolve(toJsConfig(MonitorPreferences.getConfig(getContext())));
    }

    @PluginMethod
    public void setConfig(PluginCall call) {
        MonitorPreferences.Config current = MonitorPreferences.getConfig(getContext());

        boolean enabled = call.getBoolean("enabled", current.enabled);
        float thresholdKph = call.getDouble("thresholdKph", (double) current.thresholdKph).floatValue();
        int cooldownSeconds = call.getInt("cooldownSeconds", current.cooldownSeconds);
        boolean strictAutoOpen = call.getBoolean("strictAutoOpen", current.strictAutoOpen);

        MonitorPreferences.Config next = new MonitorPreferences.Config(
                enabled,
                thresholdKph,
                cooldownSeconds,
                strictAutoOpen
        );

        MonitorPreferences.saveConfig(getContext(), next);
        syncServiceState(next.enabled);
        call.resolve(toJsConfig(next));
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{
                            Manifest.permission.POST_NOTIFICATIONS,
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION,
                            Manifest.permission.ACCESS_BACKGROUND_LOCATION
                    },
                    MONITOR_PLUGIN_PERMISSION_REQUEST_CODE
            );
        } else {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION,
                            Manifest.permission.ACCESS_BACKGROUND_LOCATION
                    },
                    MONITOR_PLUGIN_PERMISSION_REQUEST_CODE
            );
        }

        call.resolve();
    }

    @PluginMethod
    public void openHomeSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_HOME_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(Uri.fromParts("package", getContext().getPackageName(), null))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private void syncServiceState(boolean enabled) {
        Intent serviceIntent = new Intent(getContext(), SpeedMonitorService.class);
        if (enabled) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(getContext(), serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            return;
        }

        getContext().stopService(serviceIntent);
    }

    private JSObject toJsConfig(MonitorPreferences.Config config) {
        JSObject result = new JSObject();
        result.put("enabled", config.enabled);
        result.put("thresholdKph", config.thresholdKph);
        result.put("cooldownSeconds", config.cooldownSeconds);
        result.put("strictAutoOpen", config.strictAutoOpen);
        result.put("isDeviceOwner", MonitorPreferences.isDeviceOwner(getContext()));
        result.put("isDefaultLauncher", MonitorPreferences.isDefaultLauncher(getContext()));
        return result;
    }
}
