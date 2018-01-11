package org.jitsi.meet.sdk;


import android.app.Activity;
import android.app.PictureInPictureParams;
import android.os.Build;
import android.util.Log;
import android.util.Rational;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PictureInPictureModule extends ReactContextBaseJavaModule {
    private final static String TAG = "PictureInPicture";

    public PictureInPictureModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return TAG;
    }

    @ReactMethod
    public void enterPictureInPictureMode(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            final Activity currentActivity = getCurrentActivity();

            if (currentActivity == null) {
                promise.reject(new Exception("No current Activity!"));
                return;
            }

            Log.d(TAG, "Entering PiP mode");

            // Android Oreo has a better API, with a return value, on Nougat
            // we go blind, oh well!
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                final PictureInPictureParams.Builder pipParamsBuilder
                    = new PictureInPictureParams.Builder();
                pipParamsBuilder.setAspectRatio(new Rational(1, 1)).build();
                final boolean r
                    = currentActivity.enterPictureInPictureMode(pipParamsBuilder.build());
                if (r) {
                    promise.resolve(null);
                } else {
                    promise.reject(new Exception("Error entering PiP mode"));
                }
            } else {
                currentActivity.enterPictureInPictureMode();
                promise.resolve(null);
            }
            return;
        }

        promise.reject(new Exception("PiP not supported"));
    }
}
