import { checkIfValueOfEnum, getChTypeOfSendType, getSendChTypeOfSendType } from '../utility/helpers.js'
import { ChannelType, SendInfoType, SendType } from '../utility/constants.js'

/**
 * Requests either if input send to zone is muted, or returns send level
 * @param {SendType} sendType - SendType
 * @param {SendInfoType} infoType - SendInfoType
 * @param {String} channelId - 0-indexed channel ID
 * @param {String} sendChannelId - 0-indexed send channel ID
 * @returns { Buffer } Formulated command buffer
 */
export function requestSendInfo(sendType, infoType, channelId, sendChannelId) {
	if (checkIfValueOfEnum(sendType, SendType) == false) return
	if (checkIfValueOfEnum(infoType, SendInfoType) == false) return

	// get types of send
	let chType = getChTypeOfSendType(sendType)
	let sendChType = getSendChTypeOfSendType(sendType)

	console.log(
		`requestSendInfo ${infoType}: chType: ${chType}, ch: ${channelId}, sendChType: ${sendChType}, sendChNumber: ${sendChannelId}`,
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
			parseInt(channelId),
			parseInt(sendChType),
			parseInt(sendChannelId),
			0xf7,
		]),
	]
}

/**
 * Prepares MIDI string for inc/dec send level action
 * @param {*} action - Action instance options
 * @param {SendType} type - SendType
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function incDecSendLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, SendType) == false) {
		return
	}

	let chType = getChTypeOfSendType(type)
	let sendChType = getSendChTypeOfSendType(type)
	let channelId = parseInt(action.options.incdec_ch_number)
	let sendChannelId = parseInt(action.options.number)
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
			channelId,
			sendChType,
			sendChannelId,
			incdecSelector,
			0xf7,
		]),
	]
}

/**
 * Prepare MIDI string for setting input to zone mute
 * @param {Number} inputId - 0-indexed input channel ID
 * @param {Number} zoneId - 0-indexed zone channel ID
 * @param {Boolean} mute - mute state to set
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setInputToZoneMute(inputId, zoneId, mute) {
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
			inputId,
			0x01,
			zoneId,
			mute ? 0x7f : 0x3f,
			0xf7,
		]),
	]
}
