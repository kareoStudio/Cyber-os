package com.kareostudio;

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
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Looper;
import androidx.core.content.ContextCompat;

@CapacitorPlugin(
    name = "CyberGPS",
    permissions = {
        @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION}, alias = "fineLocation"),
        @Permission(strings = {Manifest.permission.ACCESS_COARSE_LOCATION}, alias = "coarseLocation")
    }
)
public class CyberGPSPlugin extends Plugin {

    @PluginMethod
    public void getLocation(PluginCall call) {
        if (!hasRequiredPermissions()) {
            requestPermissionForAlias("fineLocation", call, "locationCallback");
            return;
        }
        getCurrentLocation(call);
    }

    @PermissionCallback
    private void locationCallback(PluginCall call) {
        if (hasRequiredPermissions()) getCurrentLocation(call);
        else call.reject("Location permission denied");
    }

    private void getCurrentLocation(PluginCall call) {
        LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) { call.reject("Location manager unavailable"); return; }

        try {
            Location loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (loc == null) loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);

            if (loc != null) {
                JSObject ret = new JSObject();
                ret.put("latitude", loc.getLatitude());
                ret.put("longitude", loc.getLongitude());
                ret.put("accuracy", loc.getAccuracy());
                ret.put("altitude", loc.getAltitude());
                ret.put("speed", loc.getSpeed());
                ret.put("provider", loc.getProvider());
                call.resolve(ret);
            } else {
                lm.requestSingleUpdate(LocationManager.GPS_PROVIDER, new LocationListener() {
                    @Override public void onLocationChanged(Location location) {
                        JSObject ret = new JSObject();
                        ret.put("latitude", location.getLatitude());
                        ret.put("longitude", location.getLongitude());
                        ret.put("accuracy", location.getAccuracy());
                        ret.put("altitude", location.getAltitude());
                        ret.put("speed", location.getSpeed());
                        ret.put("provider", location.getProvider());
                        call.resolve(ret);
                    }
                    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
                    @Override public void onProviderEnabled(String provider) {}
                    @Override public void onProviderDisabled(String provider) {}
                }, Looper.getMainLooper());
            }
        } catch (SecurityException e) {
            call.reject("Security exception: " + e.getMessage());
        }
    }

    public boolean hasRequiredPermissions() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
}