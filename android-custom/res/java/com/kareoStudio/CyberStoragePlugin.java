package com.kareostudio;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.os.Environment;
import android.os.StatFs;

@CapacitorPlugin(name = "CyberStorage")
public class CyberStoragePlugin extends Plugin {

    @PluginMethod
    public void getInfo(PluginCall call) {
        StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
        long blockSize = stat.getBlockSizeLong();
        long totalBlocks = stat.getBlockCountLong();
        long availableBlocks = stat.getAvailableBlocksLong();
        long totalBytes = totalBlocks * blockSize;
        long availableBytes = availableBlocks * blockSize;
        long usedBytes = totalBytes - availableBytes;

        JSObject ret = new JSObject();
        ret.put("totalGB", String.format("%.2f", totalBytes / (1024.0 * 1024 * 1024)));
        ret.put("usedGB", String.format("%.2f", usedBytes / (1024.0 * 1024 * 1024)));
        ret.put("freeGB", String.format("%.2f", availableBytes / (1024.0 * 1024 * 1024)));
        ret.put("usedPercent", Math.round((usedBytes * 100.0) / totalBytes));
        call.resolve(ret);
    }
}