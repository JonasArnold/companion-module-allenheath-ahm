import { checkIfValueOfEnum, getChTypeOfSendType, getSendChTypeOfSendType } from '../utility/helpers.js'
import { SendInfoType, SendType } from '../utility/constants.js'
import { createLogger } from '../utility/log.js'

const log = createLogger('FormatMIDI')

/**
 * Requests either if input send to zone is muted, or returns send level
 * @param {SendType} sendType - SendType
 * @param {SendInfoType} infoType - SendInfoType
 * @param {Number} fromChNum - Source channel number (1-indexed)
 * @param {Number} toChNum - Target channel number (1-indexed)
 * @returns { Buffer } Formulated command buffer
 */
export function requestSendInfo(sendType, infoType, fromChNum, toChNum) {
	if (checkIfValueOfEnum(sendType, SendType) == false) return
	if (checkIfValueOfEnum(infoType, SendInfoType) == false) return

	// get types of send
	let chType = getChTypeOfSendType(sendType)
	let sendChType = getSendChTypeOfSendType(sendType)

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
			chType,
			0x01,
			0x0f,
			infoType,
			fromChNum - 1,
			sendChType,
			toChNum - 1,
			0xf7,
		]),
	]
	const commandName = infoType === SendInfoType.LEVEL ? 'RequestSendLevel' : 'RequestSendMute'
	log.debug(commandName, { sendType, infoType, chType, fromChNum, sendChType, toChNum }, command)
	return command
}

/**
 * Prepare MIDI string for setting input to zone mute
 * @param {Number} inputNumber - Input channel number (1-indexed)
 * @param {Number} zoneNumber - Zone number (1-indexed)
 * @param {Boolean} mute - mute state to set
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function setInputToZoneMute(inputNumber, zoneNumber, mute) {
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
			0x00,
			0x03,
			inputNumber - 1,
			0x01,
			zoneNumber - 1,
			mute ? 0x7f : 0x3f,
			0xf7,
		]),
	]
	log.debug('SetInputToZoneMute', { inputNumber, zoneNumber, mute }, command)
	return command
}

/**
 * Prepares MIDI string for adjust send level action
 * @param {SendType} type - SendType
 * @param {Number} fromChNum - Source channel number (1-indexed)
 * @param {Number} toChNum - Target channel number (1-indexed)
 * @param {Boolean} increment - true to increment, false to decrement
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export function adjustSendLevel(type, fromChNum, toChNum, increment) {
	if (checkIfValueOfEnum(type, SendType) == false) {
		return
	}

	let chType = getChTypeOfSendType(type)
	let sendChType = getSendChTypeOfSendType(type)
	let incdecSelector = increment ? 0x7f : 0x3f

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
			chType,
			0x04,
			fromChNum - 1,
			sendChType,
			toChNum - 1,
			incdecSelector,
			0xf7,
		]),
	]
	log.debug(
		'AdjustSendLevel',
		{ type, chType, fromChNum, sendChType, toChNum, increment, selector: incdecSelector },
		command,
	)
	return command
}