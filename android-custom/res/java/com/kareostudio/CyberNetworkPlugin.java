package com.kareostudio;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

@CapacitorPlugin(name = "CyberNetwork")
public class CyberNetworkPlugin extends Plugin {

    @PluginMethod
    public void getInfo(PluginCall call) {
        Context ctx = getContext();
        ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo active = cm.getActiveNetworkInfo();

        JSObject ret = new JSObject();
        boolean connected = active != null && active.isConnected();
        ret.put("connected", connected);
        ret.put("type", active != null ? active.getTypeName() : "NONE");

        if (connected && active.getType() == ConnectivityManager.TYPE_WIFI) {
            WifiManager wm = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            WifiInfo info = wm.getConnectionInfo();
            ret.put("ssid", info.getSSID());
            ret.put("speedMbps", info.getLinkSpeed());
            ret.put("rssi", info.getRssi());
        }

        call.resolve(ret);
    }
}