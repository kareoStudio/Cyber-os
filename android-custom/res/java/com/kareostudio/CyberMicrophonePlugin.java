package com.kareostudio;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import androidx.core.content.ContextCompat;

@CapacitorPlugin(
    name = "CyberMicrophone",
    permissions = {
        @Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "microphone")
    }
)
public class CyberMicrophonePlugin extends Plugin {

    private AudioRecord audioRecord;
    private boolean isRecording = false;

    @PluginMethod
    public void start(PluginCall call) {
        if (!hasPermission()) {
            requestPermissionForAlias("microphone", call, "startCallback");
            return;
        }
        startRecording(call);
    }

    @PermissionCallback
    private void startCallback(PluginCall call) {
        if (hasPermission()) {
            startRecording(call);
        } else {
            call.reject("Microphone permission denied");
        }
    }

    private void startRecording(PluginCall call) {
        try {
            int bufferSize = AudioRecord.getMinBufferSize(
                44100,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            );

            audioRecord = new AudioRecord(
                MediaRecorder.AudioSource.MIC,
                44100,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            );

            audioRecord.startRecording();
            isRecording = true;
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start microphone: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (audioRecord != null) {
            isRecording = false;
            audioRecord.stop();
            audioRecord.release();
            audioRecord = null;
        }
        call.resolve();
    }

    @PluginMethod
    public void getLevel(PluginCall call) {
        if (!isRecording || audioRecord == null) {
            JSObject ret = new JSObject();
            ret.put("level", 0);
            call.resolve(ret);
            return;
        }

        short[] buffer = new short[1024];
        int read = audioRecord.read(buffer, 0, 1024);
        double sum = 0;
        for (int i = 0; i < read; i++) {
            sum += buffer[i] * buffer[i];
        }
        double amplitude = Math.sqrt(sum / read);
        double level = Math.min(100, amplitude / 50);

        JSObject ret = new JSObject();
        ret.put("level", (int) level);
        call.resolve(ret);
    }

    private boolean hasPermission() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }
}