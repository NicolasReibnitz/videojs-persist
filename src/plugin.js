import videojs from 'video.js';
import { version as VERSION } from '../package.json';
import window from 'global/window';

// Default options for the plugin.
const defaults = {
	muted: true,
	playbackRate: true,
	volume: true,
	captions: true,
	restoreUnsupportedRate: false,
	key: 'videojs-persist'
};

/**
 * Checks local storage is available
 *
 * @returns {boolean} whether available
 */
const localStorageAvailable = () => {
	const key = 'videojs-persist-test-' + Math.floor(Math.random() * 10);

	try {
		window.localStorage.setItem(key, '.');
		window.localStorage.removeItem(key);
		return true;
	} catch (e) {
		return false;
	}
};

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player object.
 * @param    {object} [options={}]
 *           A plain object containing options for the plugin.
 */
const onPlayerReady = (player, options) => {
	player.addClass('vjs-persist');

	const playerRates = player.playbackRates ? player.playbackRates() : player.options_.playbackRates || [];

	const data = JSON.parse(window.localStorage.getItem(options.key)) || {};

	['playbackRate', 'volume', 'muted', 'captions'].forEach(prop => {
		if (!options[prop]) {
			return;
		}
		const val = data[prop];

		if (val) {
			if (prop === 'playbackRate' && !options.restoreUnsupportedRate && !playerRates.includes(val)) {
				return;
			}

			if (prop === 'captions') {
				// Get all text tracks for the current player.
				const tracks = player.textTracks();

				for (let i = 0; i < tracks.length; i++) {
					const track = tracks[i];

					// Find the right captions track and mark it as "showing".
					if (track.kind === 'captions' && track.language === val) {
						track.mode = 'showing';
					}
				}
				return;
			}

			player[prop](val);
		}
	});

	if (options.captions) {
		player.on('texttrackchange', () => {
			// Get all text tracks for the current player.
			const tracks = player.textTracks();
			let language = '';

			for (let i = 0; i < tracks.length; i++) {
				const track = tracks[i];

				// Find the current captions track and save it's language.
				if (track.mode === 'showing') {
					language = track.language;
				}
			}
			if (language) {
				data.captions = language;
			} else {
				data.captions = '';
			}

			window.localStorage.setItem(options.key, JSON.stringify(data));
		});
	}

	if (options.playbackRate) {
		player.on('ratechange', () => {
			player.defaultPlaybackRate(player.playbackRate());
			data.playbackRate = player.playbackRate();
			window.localStorage.setItem(options.key, JSON.stringify(data));
		});
	}

	if (options.muted || options.volume) {
		player.on('volumechange', () => {
			if (options.muted) {
				player.defaultMuted(player.muted());
				data.muted = player.muted();
			}
			if (options.volume) {
				data.volume = player.volume();
			}
			window.localStorage.setItem(options.key, JSON.stringify(data));
		});
	}
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function persist
 * @param    {object} [options={}]
 *           An object of options left to the plugin author to define.
 */
const persist = function (options) {
	if (!localStorageAvailable()) {
		videojs.log('videojs-persist aborted. localStorage not available.');
		return;
	}

	this.ready(() => {
		onPlayerReady(this, videojs.mergeOptions(defaults, options));
	});
};

// Register the plugin with video.js.
videojs.registerPlugin('persist', persist);

// Include the version number.
persist.VERSION = VERSION;

export default persist;
