import { checkIfValueOfEnum } from '../utility/helpers.js'
import { ChannelType } from '../utility/constants.js'
import { createLogger } from '../utility/log.js'

const log = createLogger('FormatMIDI')

/**
 * Requests channel level
 * @param {ChannelType} type - ChannelType
 * @param {Number} chNumber - Channel number (1-indexed)
 * @returns { Buffer } Formulated command buffer
 */
export function requestLevelInfo(type, chNumber) {
	if (checkIfValueOfEnum(type, ChannelType) == false) return

	const command = [
		Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, type, 0x01, 0x0b, 0x17, chNumber - 1, 0xf7]),
	]
	log.debug('RequestChannelLevel', { type, chNumber }, command)
	return command
}

/**
 * Requests if channel is muted
 * @param {ChannelType} type - ChannelType
 * @param {Number} chNumber - Channel number (1-indexed)
 * @returns { Buffer } Formulated command buffer
 */
export function requestMuteInfo(type, chNumber) {
	if (checkIfValueOfEnum(type, ChannelType) == false) return

	const command = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, type, 0x01, 0x09, chNumber - 1, 0xf7])]
	log.debug('RequestChannelMute', { type, chNumber }, command)
	return command
}

/**
 * Prepares MIDI string for set level action
 * @param {ChannelType} type - ChannelType
 * @param {Number} chNumber - Channel number (1-indexed)
 * @param {Number} level - Level value
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setLevel(type, chNumber, level) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeHex = 0xb0 + type // type code for Command "Channel Level"

	const command = [Buffer.from([typeHex, 0x63, chNumber - 1, typeHex, 0x62, 0x17, typeHex, 0x06, level])]
	log.debug('SetChannelLevel', { type, chNumber, level }, command)
	return command
}

/**
 * Prepares MIDI string for adjust level action
 * @param {ChannelType} type - ChannelType
 * @param {Number} chNumber - Channel number (1-indexed)
 * @param {Boolean} increment - true to increment, false to decrement
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function adjustLevel(type, chNumber, increment) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeCodeSetLevel = 0xb0 + type // type code for Command "Level Increment / Decrement"
	let incdecSelector = increment ? 0x7f : 0x3f

	const command = [
		Buffer.from([
			typeCodeSetLevel,
			0x63,
			chNumber - 1,
			typeCodeSetLevel,
			0x62,
			0x20,
			typeCodeSetLevel,
			0x06,
			incdecSelector,
		]),
	]
	log.debug('AdjustChannelLevel', { type, chNumber, increment, selector: incdecSelector }, command)
	return command
}
