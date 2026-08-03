package com.kareostudio;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

@CapacitorPlugin(name = "CyberVibrate")
public class CyberVibratePlugin extends Plugin {

    @PluginMethod
    public void vibrate(PluginCall call) {
        int duration = call.getInt("duration", 200);
        Vibrator v = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null) { call.reject("Vibrator unavailable"); return; }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            v.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            v.vibrate(duration);
        }
        call.resolve();
    }
}