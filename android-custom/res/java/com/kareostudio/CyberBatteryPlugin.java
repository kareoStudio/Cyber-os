package com.kareostudio;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;

@CapacitorPlugin(name = "CyberBattery")
public class CyberBatteryPlugin extends Plugin {

    @PluginMethod
    public void getStatus(PluginCall call) {
        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent battery = getContext().registerReceiver(null, filter);

        if (battery == null) { call.reject("Cannot read battery"); return; }

        int level = battery.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = battery.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        int status = battery.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        int plugged = battery.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1);
        int temp = battery.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0);
        int voltage = battery.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0);

        float pct = level * 100 / (float)scale;
        boolean charging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
        boolean ac = plugged == BatteryManager.BATTERY_PLUGGED_AC;
        boolean usb = plugged == BatteryManager.BATTERY_PLUGGED_USB;
        boolean wireless = plugged == BatteryManager.BATTERY_PLUGGED_WIRELESS;

        JSObject ret = new JSObject();
        ret.put("level", Math.round(pct));
        ret.put("charging", charging);
        ret.put("ac", ac);
        ret.put("usb", usb);
        ret.put("wireless", wireless);
        ret.put("temperature", temp / 10.0);
        ret.put("voltage", voltage);
        call.resolve(ret);
    }
}