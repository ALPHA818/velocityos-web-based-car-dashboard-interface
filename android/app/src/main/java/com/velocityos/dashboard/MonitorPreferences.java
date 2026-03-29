package com.velocityos.dashboard;

import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import androidx.annotation.NonNull;

public final class MonitorPreferences {
    private static final String PREFS_NAME = "velocityos_native_monitor";

    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_THRESHOLD_KPH = "threshold_kph";
    private static final String KEY_COOLDOWN_SECONDS = "cooldown_seconds";
    private static final String KEY_STRICT_AUTO_OPEN = "strict_auto_open";

    private static final float DEFAULT_THRESHOLD_KPH = 40f;
    private static final int DEFAULT_COOLDOWN_SECONDS = 15;
    private static final boolean DEFAULT_ENABLED = true;
    private static final boolean DEFAULT_STRICT_AUTO_OPEN = false;

    private static final float MIN_THRESHOLD_KPH = 10f;
    private static final float MAX_THRESHOLD_KPH = 240f;
    private static final int MIN_COOLDOWN_SECONDS = 3;
    private static final int MAX_COOLDOWN_SECONDS = 900;

    private MonitorPreferences() {
    }

    @NonNull
    public static Config getConfig(@NonNull Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        boolean enabled = prefs.getBoolean(KEY_ENABLED, DEFAULT_ENABLED);
        float thresholdKph = clampThreshold(prefs.getFloat(KEY_THRESHOLD_KPH, DEFAULT_THRESHOLD_KPH));
        int cooldownSeconds = clampCooldown(prefs.getInt(KEY_COOLDOWN_SECONDS, DEFAULT_COOLDOWN_SECONDS));
        boolean strictAutoOpen = prefs.getBoolean(KEY_STRICT_AUTO_OPEN, DEFAULT_STRICT_AUTO_OPEN);

        return new Config(enabled, thresholdKph, cooldownSeconds, strictAutoOpen);
    }

    public static void saveConfig(@NonNull Context context, @NonNull Config config) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean(KEY_ENABLED, config.enabled)
                .putFloat(KEY_THRESHOLD_KPH, clampThreshold(config.thresholdKph))
                .putInt(KEY_COOLDOWN_SECONDS, clampCooldown(config.cooldownSeconds))
                .putBoolean(KEY_STRICT_AUTO_OPEN, config.strictAutoOpen)
                .apply();
    }

    public static boolean isEnabled(@NonNull Context context) {
        return getConfig(context).enabled;
    }

    public static float clampThreshold(float value) {
        return Math.max(MIN_THRESHOLD_KPH, Math.min(MAX_THRESHOLD_KPH, value));
    }

    public static int clampCooldown(int value) {
        return Math.max(MIN_COOLDOWN_SECONDS, Math.min(MAX_COOLDOWN_SECONDS, value));
    }

    public static boolean isDeviceOwner(@NonNull Context context) {
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        return dpm != null && dpm.isDeviceOwnerApp(context.getPackageName());
    }

    public static boolean isDefaultLauncher(@NonNull Context context) {
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_HOME);
        ResolveInfo resolveInfo = context.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
        return resolveInfo != null
                && resolveInfo.activityInfo != null
                && context.getPackageName().equals(resolveInfo.activityInfo.packageName);
    }

    public static boolean hasStrictAutoOpenPrivileges(@NonNull Context context) {
        return isDeviceOwner(context) || isDefaultLauncher(context);
    }

    public static final class Config {
        public final boolean enabled;
        public final float thresholdKph;
        public final int cooldownSeconds;
        public final boolean strictAutoOpen;

        public Config(boolean enabled, float thresholdKph, int cooldownSeconds, boolean strictAutoOpen) {
            this.enabled = enabled;
            this.thresholdKph = clampThreshold(thresholdKph);
            this.cooldownSeconds = clampCooldown(cooldownSeconds);
            this.strictAutoOpen = strictAutoOpen;
        }

        public long cooldownMs() {
            return (long) cooldownSeconds * 1000L;
        }
    }
}
