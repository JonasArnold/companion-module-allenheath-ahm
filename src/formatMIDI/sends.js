import { checkIfValueOfEnum, getChTypeOfSendType, getSendChTypeOfSendType } from '../utility/helpers.js'
import { ChannelType, SendInfoType, SendType } from '../utility/constants.js'

/**
 * Requests either if input send to zone is muted, or returns send level
 * @param {ChannelType} sendType
 * @param {SendInfoType} infoType
 * @param {String} chNumber
 * @param {String} sendChNumber
 * @returns { Buffer } Formulated command buffer
 */
export function requestSendInfo(sendType, infoType, chNumber, sendChNumber) {
	if (checkIfValueOfEnum(sendType, ChannelType) == false) return
	if (checkIfValueOfEnum(infoType, SendInfoType) == false) return

	// get types of send
	let chType = getChTypeOfSendType(sendType)
	let sendChType = getSendChTypeOfSendType(sendType)

	console.log(
		`requestSendInfo ${infoType}: chType: ${chType}, ch: ${chNumber}, sendChType: ${sendChType}, sendChNumber: ${sendChNumber}`,
	)

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
			0x0f,
			parseInt(infoType, 16),
			parseInt(chNumber) - 1,
			parseInt(sendChType),
			parseInt(sendChNumber) - 1,
			0xf7,
		]),
	]
}

/**
 * Prepares MIDI string for inc/dec send level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export async function incDecSendLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, SendType) == false) {
		return
	}

	let chType = getChTypeOfSendType(type)
	let sendChType = getSendChTypeOfSendType(type)
	let chNumber = parseInt(action.options.incdec_ch_number)
	let sendChNumber = parseInt(action.options.number)
	let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

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
			chType,
			0x04,
			chNumber,
			sendChType,
			sendChNumber,
			incdecSelector,
			0xf7,
		]),
	]
}

/**
 * Prepare MIDI string for setting input to zone mute
 * @param {Number} input
 * @param {Number} zone
 * @param {Boolean} mute
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setInputToZoneMute(input, zone, mute) {
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
			0x00,
			0x03,
			input,
			0x01,
			zone,
			mute ? 0x7f : 0x3f,
			0xf7,
		]),
	]
}
