import { checkIfValueOfEnum } from '../utility/helpers.js'
import { ChannelType } from '../utility/constants.js'

/**
 * Requests channel level
 * @param {String} chType
 * @param {String} chNumber
 * @returns { Buffer } Formulated command buffer
 */
export function requestLevelInfo(chType, chNumber) {
	if (checkIfValueOfEnum(chType, ChannelType) == false) return
	// console.log('requested channel', chNumber, 'outputting channel', chNumber - 1)

	return [
		Buffer.from([
			0xf0,
			0x00,
			0x00,
			0x1a,
			0x50,
			0x12,
			0x01,
			0x00,
			parseInt(chType),
			0x01,
			0x0b,
			0x17,
			parseInt(chNumber), // - 1,
			0xf7,
		]),
	]
}

/**
 * Requests if channel is muted
 * @param {String} chType
 * @param {String} chNumber
 * @returns { Buffer } Formulated command buffer
 */
export function requestMuteInfo(chType, chNumber) {
	if (checkIfValueOfEnum(chType, ChannelType) == false) return

	return [
		Buffer.from([
			0xf0,
			0x00,
			0x00,
			0x1a,
			0x50,
			0x12,
			0x01,
			0x00,
			parseInt(chType),
			0x01,
			0x09,
			parseInt(chNumber), // - 1,
			0xf7,
		]),
	]
}

/**
 * Prepares MIDI string for set level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeHex = parseInt(0xb0 + type) // type code for Command "Channel Level"
	let chNumber = parseInt(action.options.setlvl_ch_number)
	let levelDec = parseInt(action.options.level)
	console.log('chNumber', action.options.setlvl_ch_number)

	return [
		Buffer.from([
			typeHex,
			0x63,
			chNumber,
			
			typeHex,
			0x62,
			0x17,
			
			typeHex,
			0x06,
			levelDec
		]),
	]
}

/**
 * Prepares MIDI string for inc/dec level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function incDecLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Level Increment / Decrement"
	let typeCodeGetLevel = parseInt(0x00 + type) // type code for Command "Get Channel Level"
	let chNumber = parseInt(action.options.incdec_ch_number)
	let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

	console.log('incDecCallback: ', type, chNumber, incdecSelector)  // numbers are correct here

	return [
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
}
