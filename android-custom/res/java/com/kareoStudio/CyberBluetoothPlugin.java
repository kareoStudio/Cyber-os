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
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;

@CapacitorPlugin(
    name = "CyberBluetooth",
    permissions = {
        @Permission(strings = {Manifest.permission.BLUETOOTH_SCAN}, alias = "btScan"),
        @Permission(strings = {Manifest.permission.BLUETOOTH_CONNECT}, alias = "btConnect"),
        @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION}, alias = "location")
    }
)
public class CyberBluetoothPlugin extends Plugin {

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner bleScanner;
    private ArrayList<JSObject> scanResults = new ArrayList<>();
    private PluginCall pendingCall;

    @PluginMethod
    public void scan(PluginCall call) {
        if (!hasPermissions()) {
            requestAllPermissions(call, "scanCallback");
            return;
        }
        performBleScan(call);
    }

    @PermissionCallback
    private void scanCallback(PluginCall call) {
        if (hasPermissions()) performBleScan(call);
        else call.reject("Bluetooth permissions required");
    }

    private void performBleScan(PluginCall call) {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter == null) { call.reject("Bluetooth not supported"); return; }
        if (!bluetoothAdapter.isEnabled()) { call.reject("Bluetooth is disabled"); return; }

        bleScanner = bluetoothAdapter.getBluetoothLeScanner();
        if (bleScanner == null) { call.reject("BLE scanner unavailable"); return; }

        scanResults.clear();
        pendingCall = call;

        ScanCallback callback = new ScanCallback() {
            @Override
            public void onScanResult(int callbackType, ScanResult result) {
                BluetoothDevice device = result.getDevice();
                JSObject obj = new JSObject();
                obj.put("name", device.getName() != null ? device.getName() : "Unknown");
                obj.put("address", device.getAddress());
                obj.put("rssi", result.getRssi());
                scanResults.add(obj);
            }
        };

        bleScanner.startScan(callback);
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            bleScanner.stopScan(callback);
            JSArray arr = new JSArray();
            for (JSObject o : scanResults) arr.put(o);
            JSObject ret = new JSObject();
            ret.put("devices", arr);
            pendingCall.resolve(ret);
        }, 5000);
    }

    private boolean hasPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED;
        }
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
}