/**
 * Creates MIDI string to request if phantom (+48V) is enabled on an input channel
 * @param {Number} channel
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function requestPhantomInfo(channel) {
	return [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x01, 0x0b, 0x1b, channel, 0xf7])]
}
