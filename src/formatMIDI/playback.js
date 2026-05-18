/**
 * Creates MIDI request for setting the track to play in AHM's built in playback engine
 * @param {Number} trackNumber
 * @param {Number} playbackChannel
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setPlaybackTrack(trackNumber, playbackChannel) {
	return [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x06, playbackChannel, trackNumber, 0xf7])]
}
