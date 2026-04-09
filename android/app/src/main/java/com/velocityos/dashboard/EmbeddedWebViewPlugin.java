package com.velocityos.dashboard;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "EmbeddedWebView")
public class EmbeddedWebViewPlugin extends Plugin {
    private static final String DIALOG_TAG = "velocityos_embedded_web_view";

    private View inlineHostView;
    private View inlineSurfaceView;
    private WebView inlineWebView;
    private ProgressBar inlineProgressBar;
    private String inlineUrl;

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "").trim();
        if (url.isEmpty()) {
            call.reject("A URL is required.");
            return;
        }

        FragmentActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        String title = call.getString("title", "Embedded Preview");
        boolean startFullscreen = call.getBoolean("startFullscreen", false);

        activity.runOnUiThread(() -> {
            FragmentManager fragmentManager = activity.getSupportFragmentManager();
            DialogFragment existing = findExistingDialog(fragmentManager);
            if (existing != null) {
                existing.dismissAllowingStateLoss();
            }

            EmbeddedWebViewDialogFragment dialog = EmbeddedWebViewDialogFragment.newInstance(url, title, startFullscreen);
            dialog.setOnClosedListener(() -> notifyListeners("closed", new JSObject()));
            dialog.show(fragmentManager, DIALOG_TAG);
            call.resolve();
        });
    }

    @PluginMethod
    public void openInline(PluginCall call) {
        String url = call.getString("url", "").trim();
        if (url.isEmpty()) {
            call.reject("A URL is required.");
            return;
        }

        FragmentActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        int x = Math.max(0, Math.round(call.getDouble("x", 0D).floatValue()));
        int y = Math.max(0, Math.round(call.getDouble("y", 0D).floatValue()));
        int width = Math.round(call.getDouble("width", 0D).floatValue());
        int height = Math.round(call.getDouble("height", 0D).floatValue());

        if (width <= 0 || height <= 0) {
            call.reject("Valid inline bounds are required.");
            return;
        }

        activity.runOnUiThread(() -> {
            DialogFragment existing = findExistingDialog(activity.getSupportFragmentManager());
            if (existing != null) {
                existing.dismissAllowingStateLoss();
            }

            ViewGroup root = findInlineRoot(activity);
            if (root == null) {
                call.reject("Inline host unavailable");
                return;
            }

            ensureInlineHost(root, url);
            updateInlineLayout(x, y, width, height);
            inlineHostView.setVisibility(View.VISIBLE);

            if (inlineUrl == null || !inlineUrl.equals(url)) {
                inlineUrl = url;
                if (inlineProgressBar != null) {
                    inlineProgressBar.setVisibility(View.VISIBLE);
                }
                inlineWebView.loadUrl(url);
            }

            call.resolve();
        });
    }

    @PluginMethod
    public void close(PluginCall call) {
        FragmentActivity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }

        activity.runOnUiThread(() -> {
            DialogFragment existing = findExistingDialog(activity.getSupportFragmentManager());
            if (existing != null) {
                existing.dismissAllowingStateLoss();
            }

            destroyInlineHost();
            call.resolve();
        });
    }

    private DialogFragment findExistingDialog(FragmentManager fragmentManager) {
        if (!(fragmentManager.findFragmentByTag(DIALOG_TAG) instanceof DialogFragment)) {
            return null;
        }

        return (DialogFragment) fragmentManager.findFragmentByTag(DIALOG_TAG);
    }

    private ViewGroup findInlineRoot(FragmentActivity activity) {
        ViewGroup overlay = activity.findViewById(R.id.embedded_web_view_overlay);
        if (overlay != null) {
            return overlay;
        }

        return activity.findViewById(android.R.id.content);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void ensureInlineHost(ViewGroup root, String url) {
        if (inlineHostView == null || inlineWebView == null || inlineProgressBar == null) {
            View view = LayoutInflater.from(root.getContext()).inflate(R.layout.inline_embedded_web_view, root, false);
            inlineHostView = view;
            inlineSurfaceView = view.findViewById(R.id.embedded_web_view_surface);
            inlineWebView = view.findViewById(R.id.embedded_web_view_content);
            inlineProgressBar = view.findViewById(R.id.embedded_web_view_progress);

            if (inlineSurfaceView != null) {
                inlineSurfaceView.setClipToOutline(true);
            }

            configureWebView(inlineWebView, inlineProgressBar);
            root.addView(view, new FrameLayout.LayoutParams(0, 0, Gravity.TOP | Gravity.START));
        } else if (inlineHostView.getParent() != root) {
            ViewGroup previousParent = (ViewGroup) inlineHostView.getParent();
            if (previousParent != null) {
                previousParent.removeView(inlineHostView);
            }
            root.addView(inlineHostView, new FrameLayout.LayoutParams(0, 0, Gravity.TOP | Gravity.START));
        }

        if (inlineProgressBar != null && (inlineUrl == null || !inlineUrl.equals(url))) {
            inlineProgressBar.setVisibility(View.VISIBLE);
        }

        root.bringToFront();
    }

    private void updateInlineLayout(int x, int y, int width, int height) {
        if (inlineHostView == null) {
            return;
        }

        ViewGroup parent = (ViewGroup) inlineHostView.getParent();
        ViewGroup.LayoutParams existingParams = inlineHostView.getLayoutParams();
        ViewGroup.MarginLayoutParams params;

        if (existingParams instanceof FrameLayout.LayoutParams) {
            params = (FrameLayout.LayoutParams) existingParams;
        } else if (existingParams instanceof ViewGroup.MarginLayoutParams) {
            params = (ViewGroup.MarginLayoutParams) existingParams;
        } else if (parent instanceof FrameLayout) {
            params = new FrameLayout.LayoutParams(width, height, Gravity.TOP | Gravity.START);
        } else {
            params = new ViewGroup.MarginLayoutParams(width, height);
        }

        params.width = width;
        params.height = height;
        params.leftMargin = x;
        params.topMargin = y;
        inlineHostView.setLayoutParams(params);
        inlineHostView.setElevation(1000f);
        inlineHostView.setTranslationZ(1000f);
        inlineHostView.bringToFront();

        if (parent != null) {
            parent.bringChildToFront(inlineHostView);
            parent.invalidate();
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(WebView webView, ProgressBar progressBar) {
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
                    getActivity().startActivity(new Intent(Intent.ACTION_VIEW, uri));
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
    }

    private void destroyInlineHost() {
        if (inlineHostView != null) {
            ViewGroup parent = (ViewGroup) inlineHostView.getParent();
            if (parent != null) {
                parent.removeView(inlineHostView);
            }
        }

        if (inlineWebView != null) {
            inlineWebView.stopLoading();
            inlineWebView.loadUrl("about:blank");
            inlineWebView.destroy();
        }

        inlineHostView = null;
        inlineSurfaceView = null;
        inlineWebView = null;
        inlineProgressBar = null;
        inlineUrl = null;
    }
}
