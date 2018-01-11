
import { NativeModules } from 'react-native';

const pip = NativeModules.PictureInPicture;


export function enterPictureInPictureMode() {
    if (pip) {
        return pip.enterPictureInPictureMode();
    }

    return Promise.reject(new Error('PiP not supported'));
}
