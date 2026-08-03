package com.kareostudio;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.os.Build;

@CapacitorPlugin(name = "CyberDevice")
public class CyberDevicePlugin extends Plugin {

    @PluginMethod
    public void getInfo(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("brand", Build.BRAND);
        ret.put("model", Build.MODEL);
        ret.put("device", Build.DEVICE);
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("product", Build.PRODUCT);
        ret.put("androidVersion", Build.VERSION.RELEASE);
        ret.put("sdkInt", Build.VERSION.SDK_INT);
        ret.put("hardware", Build.HARDWARE);
        ret.put("board", Build.BOARD);
        ret.put("serial", Build.SERIAL);
        ret.put("fingerprint", Build.FINGERPRINT);
        call.resolve(ret);
    }
}