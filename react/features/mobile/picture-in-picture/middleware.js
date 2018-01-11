// @flow

import { DeviceEventEmitter } from 'react-native';
import type { Dispatch } from 'redux';

import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT
} from '../../app';
import {
    VIDEO_QUALITY_LEVELS,
    setLastN,
    setReceiveVideoQuality
} from '../../base/conference';
import { pinParticipant } from '../../base/participants';
import { MiddlewareRegistry } from '../../base/redux';

import {
    _setListener,
    pipModeChanged
} from './actions';
import {
    _SET_PIP_MODE_LISTENER,
    PIP_MODE_CHANGED
} from './actionTypes';

/**
 * Middleware that captures App lifetime actions and subscribes to application
 * state changes. When the application state changes it will fire the action
 * required to mute or unmute the local video in case the application goes to
 * the background or comes back from it.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_PIP_MODE_LISTENER: {
        // Remove the current/old listener.
        const { pipModeListener } = store.getState()['features/pip'];

        if (pipModeListener) {
            pipModeListener.remove();
        }

        // Add the new listener.
        if (action.listener) {
            DeviceEventEmitter.addListener(
                'pictureInPictureModeChanged', action.listener);
        }
        break;
    }

    case PIP_MODE_CHANGED:
        _pipModeChanged(store, action.inPipMode);
        break;

    case APP_WILL_MOUNT:
        store.dispatch(
            _setListener(
                _onPipModeChange.bind(undefined, store.dispatch)));
        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(_setListener(null));
        break;
    }

    return next(action);
});

/**
 * Handles app state changes. Dispatches the necessary Redux actions for the
 * local video to be muted when the app goes to the background, and to be
 * unmuted when the app comes back.
 *
 * @param {Dispatch} dispatch - Redux dispatch function.
 * @param {string} appState - The current app state.
 * @private
 * @returns {void}
 */
function _pipModeChanged({ dispatch, getState }, inPipMode: boolean) {
    console.log('XXXXXX PIP MODE CHANGED ' + inPipMode);

    const { audioOnly } = getState()['features/base/conference'];

    if (inPipMode) {
        // Unpin any pinned participant
        dispatch(pinParticipant(null));

        // Set last N to 1, unless we are in audio-only mode
        if (!audioOnly) {
            dispatch(setLastN(1));
        }

        // Set the received video quality to low
        dispatch(setReceiveVideoQuality(VIDEO_QUALITY_LEVELS.LOW));
    } else {
        // Set last N back to its original value
        if (!audioOnly) {
            dispatch(setLastN(undefined));
        }

        // Set the received video quality back to high
        dispatch(setReceiveVideoQuality(VIDEO_QUALITY_LEVELS.HIGH));
    }
}

/**
 * Called by React Native's AppState API to notify that the application state
 * has changed. Dispatches the change within the (associated) Redux store.
 *
 * @param {Dispatch} dispatch - Redux dispatch function.
 * @param {string} appState - The current application execution state.
 * @private
 * @returns {void}
 */
function _onPipModeChange(dispatch: Dispatch<*>, event: Event) {
    dispatch(pipModeChanged(event.isInPictureInPictureMode));
}
