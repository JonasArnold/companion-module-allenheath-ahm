import { createLogger } from '../utility/log.js'

const log = createLogger('FormatMIDI')

/**
 * Creates MIDI request for recalling an AHM preset
 * @param {Number} presetNumber - Preset number (1-indexed)
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function recallPreset(presetNumber) {
	// subtract 1 to calculate the 0-indexed preset number for the MIDI command
	const presetId = presetNumber - 1
	const bank = Math.floor(presetId / 128)
	const presetOffset = presetId % 128
	const command = [Buffer.from([0xb0, 0x00, bank, 0xc0, presetOffset])]

	log.debug('RecallPreset', { presetNumber, bank, presetOffset }, command)
	return command
}
