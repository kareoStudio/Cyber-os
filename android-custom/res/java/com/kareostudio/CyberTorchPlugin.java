package com.kareostudio;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;

@CapacitorPlugin(name = "CyberTorch")
public class CyberTorchPlugin extends Plugin {

    private CameraManager cameraManager;
    private String cameraId;

    @PluginMethod
    public void toggle(PluginCall call) {
        boolean on = call.getBoolean("on", true);
        try {
            cameraManager = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
            cameraId = cameraManager.getCameraIdList()[0];
            cameraManager.setTorchMode(cameraId, on);
            call.resolve();
        } catch (CameraAccessException e) {
            call.reject("Camera access error: " + e.getMessage());
        } catch (Exception e) {
            call.reject("Error: " + e.getMessage());
        }
    }
}