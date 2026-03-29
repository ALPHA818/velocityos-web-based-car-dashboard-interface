package com.velocityos.dashboard;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class SpeedMonitorService extends Service implements LocationListener {
    private static final String TAG = "SpeedMonitorService";

    private static final String SERVICE_CHANNEL_ID = "velocityos_speed_monitor";
    private static final String ALERT_CHANNEL_ID = "velocityos_speed_alert";

    private static final int SERVICE_NOTIFICATION_ID = 4101;
    private static final int ALERT_NOTIFICATION_ID = 4102;

    private static final long LOCATION_MIN_TIME_MS = 300L;
    private static final float LOCATION_MIN_DISTANCE_M = 0f;

    private LocationManager locationManager;
    private Location lastLocation;
    private long lastLocationSampleElapsedMs = 0L;
    private long lastAlertElapsedMs = 0L;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "onCreate - initializing foreground service");
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        createNotificationChannels();
        startForeground(SERVICE_NOTIFICATION_ID, buildServiceNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        MonitorPreferences.Config config = MonitorPreferences.getConfig(this);
        if (!config.enabled) {
            stopSelf();
            return START_NOT_STICKY;
        }

        Log.i(TAG, "onStartCommand - requesting location updates");
        requestLocationUpdatesIfPermitted();
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        removeLocationUpdates();
    }

    @Override
    public void onProviderEnabled(@NonNull String provider) {
        requestLocationUpdatesIfPermitted();
    }

    @Override
    public void onProviderDisabled(@NonNull String provider) {
        Log.w(TAG, "Location provider disabled: " + provider);
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        // Deprecated callback; intentionally left blank for compatibility.
    }

    @Override
    public void onLocationChanged(@NonNull Location location) {
        MonitorPreferences.Config config = MonitorPreferences.getConfig(this);
        if (!config.enabled) {
            removeLocationUpdates();
            stopSelf();
            return;
        }

        final long sampleElapsedMs = SystemClock.elapsedRealtime();
        final float speedMps = resolveSpeedMps(location, sampleElapsedMs);
        lastLocationSampleElapsedMs = sampleElapsedMs;
        lastLocation = location;

        final float speedKph = speedMps * 3.6f;
        if (speedKph < config.thresholdKph) {
            return;
        }

        final long now = SystemClock.elapsedRealtime();
        if (now - lastAlertElapsedMs < config.cooldownMs()) {
            return;
        }

        if (isAppInForeground()) {
            Log.d(TAG, "Speed threshold exceeded but app is already foreground");
            return;
        }

        lastAlertElapsedMs = now;
        Log.i(TAG, "Speed threshold exceeded in background: " + speedKph + " km/h. Triggering launch.");
        launchDashboardForSpeedAlert(speedKph, config);
    }

    private float resolveSpeedMps(@NonNull Location current, long sampleElapsedMs) {
        if (current.hasSpeed() && current.getSpeed() > 0.2f) {
            return current.getSpeed();
        }

        if (lastLocation == null) {
            return 0f;
        }

        long dtMs = sampleElapsedMs - lastLocationSampleElapsedMs;
        if (dtMs <= 0) {
            dtMs = current.getTime() - lastLocation.getTime();
        }

        if (dtMs <= 0) {
            return 0f;
        }

        final float distanceMeters = lastLocation.distanceTo(current);
        return distanceMeters / (dtMs / 1000f);
    }

    private void launchDashboardForSpeedAlert(float speedKph, @NonNull MonitorPreferences.Config config) {
        final Intent launchIntent = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("velocityos_speed_alert_kph", speedKph)
                .putExtra("velocityos_speed_alert_ts", System.currentTimeMillis());

        final PendingIntent launchPendingIntent = PendingIntent.getActivity(
                this,
                99,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | immutableFlag()
        );

        final Notification alertNotification = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_map)
                .setContentTitle("VelocityOS speed alert")
            .setContentText("Speed over " + Math.round(config.thresholdKph) + " km/h detected. Opening dashboard.")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_NAVIGATION)
                .setAutoCancel(true)
                .setContentIntent(launchPendingIntent)
                .setFullScreenIntent(launchPendingIntent, true)
                .build();

        if (canPostNotifications()) {
            NotificationManagerCompat.from(this).notify(ALERT_NOTIFICATION_ID, alertNotification);
        }

        boolean allowDirectLaunch = !config.strictAutoOpen || MonitorPreferences.hasStrictAutoOpenPrivileges(this);
        if (!allowDirectLaunch) {
            Log.w(TAG, "Strict auto-open enabled without device-owner/default-launcher privilege; showing alert only");
            return;
        }

        try {
            launchPendingIntent.send();
        } catch (Exception ex) {
            Log.w(TAG, "PendingIntent send failed for launch", ex);
        }

        try {
            Log.i(TAG, "Attempting direct activity launch from service");
            startActivity(launchIntent);
        } catch (Exception ex) {
            Log.w(TAG, "Unable to launch activity directly from background", ex);
        }
    }

    private Notification buildServiceNotification() {
        final Intent launchIntent = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        final PendingIntent launchPendingIntent = PendingIntent.getActivity(
                this,
                98,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | immutableFlag()
        );

        return new NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_map)
                .setContentTitle("VelocityOS monitoring")
                .setContentText("Monitoring speed for automatic dashboard launch")
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setOnlyAlertOnce(true)
                .setOngoing(true)
                .setContentIntent(launchPendingIntent)
                .build();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        final NotificationManager notificationManager = getSystemService(NotificationManager.class);
        if (notificationManager == null) {
            return;
        }

        final NotificationChannel serviceChannel = new NotificationChannel(
                SERVICE_CHANNEL_ID,
                "Speed Monitor",
                NotificationManager.IMPORTANCE_LOW
        );
        serviceChannel.setDescription("Foreground service notification for background speed monitoring");

        final NotificationChannel alertChannel = new NotificationChannel(
                ALERT_CHANNEL_ID,
                "Speed Alerts",
                NotificationManager.IMPORTANCE_HIGH
        );
        alertChannel.setDescription("Alerts when speed threshold is exceeded while app is closed");

        notificationManager.createNotificationChannel(serviceChannel);
        notificationManager.createNotificationChannel(alertChannel);
    }

    @SuppressLint("MissingPermission")
    private void requestLocationUpdatesIfPermitted() {
        if (!hasLocationPermission() || locationManager == null) {
            Log.w(TAG, "Location permission missing; speed monitor is idle");
            return;
        }

        removeLocationUpdates();

        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        LOCATION_MIN_TIME_MS,
                        LOCATION_MIN_DISTANCE_M,
                        this
                );
            }

            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        LOCATION_MIN_TIME_MS,
                        LOCATION_MIN_DISTANCE_M,
                        this
                );
            }
        } catch (Exception ex) {
            Log.e(TAG, "Failed to request location updates", ex);
        }
    }

    private void removeLocationUpdates() {
        if (locationManager == null) {
            return;
        }

        try {
            locationManager.removeUpdates(this);
        } catch (Exception ignored) {
            // Ignore errors from stale listeners.
        }
    }

    private boolean hasLocationPermission() {
        final int fine = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION);
        final int coarse = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION);
        return fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED;
    }

    private boolean canPostNotifications() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true;
        }
        return ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    private int immutableFlag() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return PendingIntent.FLAG_IMMUTABLE;
        }
        return 0;
    }

    private boolean isAppInForeground() {
        ActivityManager.RunningAppProcessInfo processInfo = new ActivityManager.RunningAppProcessInfo();
        ActivityManager.getMyMemoryState(processInfo);
        return processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                || processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE;
    }
}
