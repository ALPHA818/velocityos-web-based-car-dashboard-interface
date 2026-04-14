package com.velocityos.dashboard;

import android.os.Bundle;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(name = "NativeTts")
public class NativeTtsPlugin extends Plugin {
    private interface InitCallback {
        void onReady(boolean ready);
    }

    private final Object initLock = new Object();
    private final List<InitCallback> pendingInitCallbacks = new ArrayList<>();

    private TextToSpeech textToSpeech;
    private boolean isInitializing = false;
    private boolean isReady = false;

    @Override
    public void load() {
        super.load();
        ensureTextToSpeech(null);
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        shutdownTextToSpeech();
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        ensureTextToSpeech((ready) -> {
            JSObject result = new JSObject();
            result.put("available", ready);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void getVoices(PluginCall call) {
        ensureTextToSpeech((ready) -> {
            JSObject result = new JSObject();
            result.put("voices", ready ? toVoiceArray() : new JSArray());
            call.resolve(result);
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "").trim();
        if (text.isEmpty()) {
            JSObject result = new JSObject();
            result.put("accepted", false);
            call.resolve(result);
            return;
        }

        ensureTextToSpeech((ready) -> {
            if (!ready || textToSpeech == null) {
                JSObject result = new JSObject();
                result.put("accepted", false);
                call.resolve(result);
                return;
            }

            getActivity().runOnUiThread(() -> {
                String voiceName = call.getString("voiceName", "").trim();
                String voiceLang = call.getString("voiceLang", "").trim();
                float rate = call.getDouble("rate", 1D).floatValue();
                float pitch = call.getDouble("pitch", 1D).floatValue();
                float volume = call.getDouble("volume", 1D).floatValue();

                applyVoiceSelection(voiceName, voiceLang);
                textToSpeech.setSpeechRate(clamp(rate, 0.5f, 2f, 1f));
                textToSpeech.setPitch(clamp(pitch, 0f, 2f, 1f));
                textToSpeech.stop();

                int status;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    Bundle params = new Bundle();
                    params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, clamp(volume, 0f, 1f, 1f));
                    status = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params, "velocityos-ai-voice");
                } else {
                    status = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null);
                }

                JSObject result = new JSObject();
                result.put("accepted", status != TextToSpeech.ERROR);
                call.resolve(result);
            });
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (textToSpeech != null && getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                textToSpeech.stop();
                call.resolve();
            });
            return;
        }

        call.resolve();
    }

    private void ensureTextToSpeech(InitCallback callback) {
        if (callback != null) {
            synchronized (initLock) {
                if (isReady && textToSpeech != null) {
                    callback.onReady(true);
                    return;
                }
                pendingInitCallbacks.add(callback);
            }
        }

        if (getActivity() == null) {
            dispatchInitCallbacks(false);
            return;
        }

        synchronized (initLock) {
            if (isReady && textToSpeech != null) {
                dispatchInitCallbacks(true);
                return;
            }

            if (isInitializing) {
                return;
            }

            isInitializing = true;
        }

        getActivity().runOnUiThread(() -> {
            if (textToSpeech != null) {
                synchronized (initLock) {
                    isInitializing = false;
                }
                dispatchInitCallbacks(isReady);
                return;
            }

            textToSpeech = new TextToSpeech(getContext(), (status) -> {
                synchronized (initLock) {
                    isReady = status == TextToSpeech.SUCCESS;
                    isInitializing = false;
                }
                dispatchInitCallbacks(isReady);
            });
        });
    }

    private void dispatchInitCallbacks(boolean ready) {
        List<InitCallback> callbacks;
        synchronized (initLock) {
            callbacks = new ArrayList<>(pendingInitCallbacks);
            pendingInitCallbacks.clear();
        }

        for (InitCallback callback : callbacks) {
            callback.onReady(ready);
        }
    }

    private void shutdownTextToSpeech() {
        if (textToSpeech == null) {
            return;
        }

        textToSpeech.stop();
        textToSpeech.shutdown();
        textToSpeech = null;

        synchronized (initLock) {
            isReady = false;
            isInitializing = false;
            pendingInitCallbacks.clear();
        }
    }

    private void applyVoiceSelection(String requestedName, String requestedLang) {
        if (textToSpeech == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Voice requestedVoice = findVoice(requestedName, requestedLang);
            if (requestedVoice != null) {
                textToSpeech.setVoice(requestedVoice);
                return;
            }
        }

        Locale locale = requestedLang.isEmpty() ? Locale.getDefault() : Locale.forLanguageTag(requestedLang);
        textToSpeech.setLanguage(locale);
    }

    private Voice findVoice(String requestedName, String requestedLang) {
        if (textToSpeech == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return null;
        }

        Set<Voice> voices = textToSpeech.getVoices();
        if (voices == null || voices.isEmpty()) {
            return null;
        }

        if (!requestedName.isEmpty()) {
            for (Voice voice : voices) {
                if (requestedName.equals(voice.getName())) {
                    return voice;
                }
            }
        }

        if (!requestedLang.isEmpty()) {
            String requestedTag = Locale.forLanguageTag(requestedLang).toLanguageTag();
            for (Voice voice : voices) {
                Locale locale = voice.getLocale();
                if (locale != null && requestedTag.equalsIgnoreCase(locale.toLanguageTag())) {
                    return voice;
                }
            }
        }

        return textToSpeech.getVoice();
    }

    private JSArray toVoiceArray() {
        JSArray voicesArray = new JSArray();

        if (textToSpeech == null) {
            return voicesArray;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Voice currentVoice = textToSpeech.getVoice();
            Set<Voice> voices = textToSpeech.getVoices();

            if (voices != null) {
                for (Voice voice : voices) {
                    Locale locale = voice.getLocale();
                    if (locale == null) {
                        continue;
                    }

                    JSObject voiceObject = new JSObject();
                    voiceObject.put("name", voice.getName());
                    voiceObject.put("lang", locale.toLanguageTag());
                    voiceObject.put("isDefault", currentVoice != null && currentVoice.getName().equals(voice.getName()));
                    voicesArray.put(voiceObject);
                }
            }

            return voicesArray;
        }

        Locale locale = textToSpeech.getLanguage();
        if (locale != null) {
            JSObject voiceObject = new JSObject();
            voiceObject.put("name", locale.getDisplayName());
            voiceObject.put("lang", locale.toString());
            voiceObject.put("isDefault", true);
            voicesArray.put(voiceObject);
        }

        return voicesArray;
    }

    private float clamp(float value, float min, float max, float fallback) {
        if (Float.isNaN(value) || Float.isInfinite(value)) {
            return fallback;
        }

        return Math.max(min, Math.min(max, value));
    }
}