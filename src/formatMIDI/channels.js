import { checkIfValueOfEnum, getChannelTypeName } from '../utility/helpers.js'
import { ChannelType } from '../utility/constants.js'

const LOG_PREFIX = '[MIDI Builder]'
const log = (message) => console.log(`${LOG_PREFIX} ${message}`)

/**
 * Requests channel level
 * @param {ChannelType} type - ChannelType
 * @param {String} id - Channel ID (0-indexed)
 * @returns { Buffer } Formulated command buffer
 */
export function requestLevelInfo(type, id) {
	if (checkIfValueOfEnum(type, ChannelType) == false) return

	const command = [
		Buffer.from([
			0xf0,
			0x00,
			0x00,
			0x1a,
			0x50,
			0x12,
			0x01,
			0x00,
			parseInt(type),
			0x01,
			0x0b,
			0x17,
			parseInt(id),
			0xf7,
		]),
	]
	log(`Request level -- type: ${getChannelTypeName(type)}, channel: ${parseInt(id) + 1}`)
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
		Buffer.from([
			0xf0,
			0x00,
			0x00,
			0x1a,
			0x50,
			0x12,
			0x01,
			0x00,
			parseInt(type),
			0x01,
			0x09,
			parseInt(id),
			0xf7,
		]),
	]
	log(`Request mute -- type: ${getChannelTypeName(type)}, channel: ${parseInt(id) + 1}`)
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
	log(`Set level -- type: ${getChannelTypeName(type)}, channel: ${chNumber + 1}, level: ${levelDec}`)
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
	log(`Adjust level -- type: ${getChannelTypeName(type)}, channel: ${chNumber + 1}, operation: ${action.options.incdec}`)
	return command
}
