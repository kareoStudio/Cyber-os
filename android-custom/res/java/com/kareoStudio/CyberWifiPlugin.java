package com.kareostudio;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import java.util.List;

@CapacitorPlugin(
    name = "CyberWifi",
    permissions = {
        @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION}, alias = "location"),
        @Permission(strings = {Manifest.permission.NEARBY_WIFI_DEVICES}, alias = "nearbyWifi", minSdkVersion = 33)
    }
)
public class CyberWifiPlugin extends Plugin {

    @PluginMethod
    public void scan(PluginCall call) {
        if (!hasRequiredPermissions()) {
            requestAllPermissions(call, "scanCallback");
            return;
        }
        performScan(call);
    }

    @PermissionCallback
    private void scanCallback(PluginCall call) {
        if (hasRequiredPermissions()) performScan(call);
        else call.reject("Location permission required for WiFi scanning");
    }

    private void performScan(PluginCall call) {
        WifiManager wifi = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifi == null) { call.reject("WiFi manager unavailable"); return; }
        if (!wifi.isWifiEnabled()) { call.reject("WiFi is disabled"); return; }

        wifi.startScan();
        List<ScanResult> results = wifi.getScanResults();
        JSArray networks = new JSArray();
        for (ScanResult r : results) {
            JSObject n = new JSObject();
            n.put("ssid", r.SSID != null ? r.SSID : "");
            n.put("bssid", r.BSSID != null ? r.BSSID : "");
            n.put("level", r.level);
            n.put("frequency", r.frequency);
            n.put("capabilities", r.capabilities != null ? r.capabilities : "");
            networks.put(n);
        }
        JSObject ret = new JSObject();
        ret.put("networks", networks);
        call.resolve(ret);
    }

    private boolean hasRequiredPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.NEARBY_WIFI_DEVICES) == PackageManager.PERMISSION_GRANTED;
        }
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
}