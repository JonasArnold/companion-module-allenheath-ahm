import { createLogger } from '../utility/log.js'

const log = createLogger('FormatMIDI')

/**
 * Creates MIDI request for setting the track to play in AHM's built in playback engine
 * @param {Number} trackNumber - Track number (1-indexed)
 * @param {PlaybackChannel} playbackChannel - PlaybackChannel
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setPlaybackTrack(trackNumber, playbackChannel) {
	const command = [
		Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x06, playbackChannel, trackNumber - 1, 0xf7]),
	]
	log.debug('SetPlaybackTrack', { trackNumber, playbackChannel }, command)
	return command
}
