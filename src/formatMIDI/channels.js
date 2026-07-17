import { checkIfValueOfEnum } from '../utility/helpers.js'
import { ChannelType } from '../utility/constants.js'
import { createLogger } from '../utility/log.js'

const log = createLogger('FormatMIDI')

/**
 * Requests channel level
 * @param {ChannelType} type - ChannelType
 * @param {String} id - Channel ID (0-indexed)
 * @returns { Buffer } Formulated command buffer
 */
export function requestLevelInfo(type, id) {
	if (checkIfValueOfEnum(type, ChannelType) == false) return

	const command = [
		Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, parseInt(type), 0x01, 0x0b, 0x17, parseInt(id), 0xf7]),
	]
	log.debug('RequestChannelLevel', { type, channelId: id }, command)
	return command
}

/**
 * Requests if channel is muted
 * @param {ChannelType} type - ChannelType
 * @param {String} id - Channel ID (0-indexed)
 * @returns { Buffer } Formulated command buffer
 */
export function requestMuteInfo(type, id) {
	if (checkIfValueOfEnum(type, ChannelType) == false) return

	const command = [
		Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, parseInt(type), 0x01, 0x09, parseInt(id), 0xf7]),
	]
	log.debug('RequestChannelMute', { type, channelId: id }, command)
	return command
}

/**
 * Prepares MIDI string for set level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type - ChannelType
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeHex = parseInt(0xb0 + type) // type code for Command "Channel Level"
	let chNumber = parseInt(action.options.setlvl_ch_number)
	let levelDec = parseInt(action.options.level)

	const command = [Buffer.from([typeHex, 0x63, chNumber, typeHex, 0x62, 0x17, typeHex, 0x06, levelDec])]
	log.debug('SetChannelLevel', { type, channelId: chNumber, level: levelDec }, command)
	return command
}

/**
 * Prepares MIDI string for inc/dec level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type - ChannelType
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function incDecLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Level Increment / Decrement"
	let chNumber = parseInt(action.options.incdec_ch_number)
	let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

	const command = [
		Buffer.from([
			typeCodeSetLevel,
			0x63,
			chNumber,
			typeCodeSetLevel,
			0x62,
			0x20,
			typeCodeSetLevel,
			0x06,
			incdecSelector,
		]),
	]
	log.debug(
		'AdjustChannelLevel',
		{ type, channelId: chNumber, operation: action.options.incdec, selector: incdecSelector },
		command,
	)
	return command
}
