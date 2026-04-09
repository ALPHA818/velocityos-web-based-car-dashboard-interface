package com.velocityos.dashboard;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.ActivityNotFoundException;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatButton;
import androidx.fragment.app.DialogFragment;

public class EmbeddedWebViewDialogFragment extends DialogFragment {
    private static final String ARG_URL = "url";
    private static final String ARG_TITLE = "title";
    private static final String ARG_START_FULLSCREEN = "startFullscreen";

    private View surfaceView;
    private WebView webView;
    private ProgressBar progressBar;
    private AppCompatButton fullscreenButton;
    private boolean isFullscreen;
    private Runnable onClosedListener;

    public static EmbeddedWebViewDialogFragment newInstance(String url, String title, boolean startFullscreen) {
        Bundle args = new Bundle();
        args.putString(ARG_URL, url);
        args.putString(ARG_TITLE, title);
        args.putBoolean(ARG_START_FULLSCREEN, startFullscreen);

        EmbeddedWebViewDialogFragment fragment = new EmbeddedWebViewDialogFragment();
        fragment.setArguments(args);
        return fragment;
    }

    public void setOnClosedListener(@Nullable Runnable listener) {
        this.onClosedListener = listener;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        Dialog dialog = new Dialog(requireContext());
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCanceledOnTouchOutside(true);
        dialog.setOnKeyListener((dialogInterface, keyCode, event) -> {
            if (keyCode == KeyEvent.KEYCODE_BACK
                    && event.getAction() == KeyEvent.ACTION_UP
                    && webView != null
                    && webView.canGoBack()) {
                webView.goBack();
                return true;
            }

            return false;
        });
        return dialog;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.dialog_embedded_web_view, container, false);

        surfaceView = view.findViewById(R.id.embedded_web_view_surface);
        progressBar = view.findViewById(R.id.embedded_web_view_progress);
        webView = view.findViewById(R.id.embedded_web_view_content);
        fullscreenButton = view.findViewById(R.id.embedded_web_view_fullscreen_toggle);
        AppCompatButton closeButton = view.findViewById(R.id.embedded_web_view_close);
        TextView titleView = view.findViewById(R.id.embedded_web_view_title);

        Bundle args = requireArguments();
        String url = args.getString(ARG_URL, "");
        String title = args.getString(ARG_TITLE, "Embedded Preview");
        isFullscreen = args.getBoolean(ARG_START_FULLSCREEN, false);

        titleView.setText(title);
        closeButton.setOnClickListener(button -> dismissAllowingStateLoss());
        fullscreenButton.setOnClickListener(button -> {
            isFullscreen = !isFullscreen;
            updatePresentation();
        });

        configureWebView(url);
        return view;
    }

    @Override
    public void onStart() {
        super.onStart();

        Dialog dialog = getDialog();
        if (dialog == null || dialog.getWindow() == null) {
            return;
        }

        Window window = dialog.getWindow();
        window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        window.setDimAmount(0.38f);
        updatePresentation();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    public void onPause() {
        if (webView != null) {
            webView.onPause();
            webView.pauseTimers();
        }
        super.onPause();
    }

    @Override
    public void onDismiss(@NonNull DialogInterface dialog) {
        super.onDismiss(dialog);
        if (onClosedListener != null) {
            onClosedListener.run();
        }
    }

    @Override
    public void onDestroyView() {
        if (webView != null) {
            webView.stopLoading();
            webView.loadUrl("about:blank");
            webView.destroy();
            webView = null;
        }
        super.onDestroyView();
        onClosedListener = null;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(String url) {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportMultipleWindows(false);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (progressBar == null) {
                    return;
                }

                progressBar.setProgress(newProgress);
                progressBar.setVisibility(newProgress >= 95 ? View.GONE : View.VISIBLE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();

                if (scheme == null
                        || scheme.equalsIgnoreCase("http")
                        || scheme.equalsIgnoreCase("https")) {
                    return false;
                }

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException ignored) {
                    // Ignore unsupported schemes and keep the current page visible.
                }

                return true;
            }

            @Override
            public void onPageFinished(WebView view, String finishedUrl) {
                if (progressBar != null) {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        progressBar.setVisibility(View.VISIBLE);
        webView.loadUrl(url);
    }

    private void updatePresentation() {
        Dialog dialog = getDialog();
        if (dialog == null || dialog.getWindow() == null || surfaceView == null || fullscreenButton == null) {
            return;
        }

        Window window = dialog.getWindow();
        DisplayMetrics metrics = requireContext().getResources().getDisplayMetrics();

        WindowManager.LayoutParams params = new WindowManager.LayoutParams();
        params.copyFrom(window.getAttributes());
        params.gravity = Gravity.CENTER;
        params.width = isFullscreen ? ViewGroup.LayoutParams.MATCH_PARENT : Math.round(metrics.widthPixels * 0.92f);
        params.height = isFullscreen ? ViewGroup.LayoutParams.MATCH_PARENT : Math.round(metrics.heightPixels * 0.82f);

        window.setAttributes(params);
        surfaceView.setBackgroundResource(
                isFullscreen
                        ? R.drawable.embedded_web_view_surface_fullscreen
                        : R.drawable.embedded_web_view_surface
        );
        fullscreenButton.setText(isFullscreen ? "Windowed" : "Full screen");
    }
}
