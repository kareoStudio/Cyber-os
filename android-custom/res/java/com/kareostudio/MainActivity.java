package com.kareostudio;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CyberWifiPlugin.class);
        registerPlugin(CyberBluetoothPlugin.class);
        registerPlugin(CyberGPSPlugin.class);
        registerPlugin(CyberBatteryPlugin.class);
        registerPlugin(CyberStoragePlugin.class);
        registerPlugin(CyberNetworkPlugin.class);
        registerPlugin(CyberVibratePlugin.class);
        registerPlugin(CyberTorchPlugin.class);
        registerPlugin(CyberDevicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}