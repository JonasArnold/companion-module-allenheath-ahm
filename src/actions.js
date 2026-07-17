import {
	getChoicesArrayWithIncrementingNumbers,
	getChoicesArrayOf1DArray,
	getChoicesArrayOfKeyValueObject,
} from './utility/helpers.js'
import { ChannelType, SendType, SendInfoType, dbu_Values, PlaybackChannel } from './utility/constants.js'
import { setLevelCallback, incDecLevelCallback, requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'
import { requestSendInfo, incDecSendLevelCallback, setInputToZoneMute } from './formatMIDI/sends.js'
import { setPlaybackTrack } from './formatMIDI/playback.js'
import { getContext } from './context.js'
import { FeedbackId } from './feedbacks.js'

const PRESET_COUNT = 500
const PLAYBACK_COUNT = 127

export const ActionId = {
	MuteInput: 'mute_input',
	MuteZone: 'mute_zone',
	MuteControlGroup: 'mute_controlgroup',
	SetInputLevel: 'set_level_input',
	AdjustInputLevel: 'inc_dec_level_input',
	SetZoneLevel: 'set_level_zone',
	AdjustZoneLevel: 'inc_dec_level_zone',
	SetControlGroupLevel: 'set_level_controlgroup',
	AdjustControlGroupLevel: 'inc_dec_level_controlgroup',
	RecallPreset: 'preset_recall',
	PlaybackTrack: 'playback_track',
	MuteInputToZone: 'input_to_zone',
	AdjustInputToZoneSendLevel: 'inc_dec_in_zn_send_level',
	AdjustZoneToZoneSendLevel: 'inc_dec_zn_zn_send_level',
}

/**
 * @typedef {typeof ActionId[keyof typeof ActionId]} ActionId
 */

/**
 * Builds dropdown options for Companion Actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty
 * @param {Number} offset
 * @returns {Object[]}
 */
function listOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
	]
}

/**
 * Builds Companion Action Options for mute actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty
 * @param {Number} offset
 * @returns {Object[]}
 */
function muteOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'mute_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
		{
			type: 'checkbox',
			id: 'mute',
			label: 'Mute',
			default: true,
		},
	]
}

/**
 * Builds Companion Action Options for set level actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty
 * @param {Number} offset
 * @returns {Object[]}
 */
function setLevelOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'setlvl_ch_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
		{
			type: 'dropdown',
			id: 'level',
			label: 'Set Level (dBu)',
			default: '0',
			choices: getChoicesArrayOf1DArray(dbu_Values),
		},
	]
}

/**
 * Builds Companion Action Options for inc/dec level actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty
 * @param {Number} offset
 * @returns {Object[]}
 */
function incDecOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'incdec_ch_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
		{
			type: 'dropdown',
			id: 'incdec',
			label: 'Increment/Decrement',
			default: 'inc',
			choices: [
				{ id: 'inc', label: 'Increment' },
				{ id: 'dec', label: 'Decrement' },
			],
		},
	]
}

/**
 * Builds Companion Action Options for playback actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty
 * @param {Number} offset
 * @returns {Object[]}
 */
function playbackChannelOptions(name) {
	return [
		{
			type: 'dropdown',
			id: 'playbackChannel',
			label: name,
			default: 0,
			choices: getChoicesArrayOfKeyValueObject(PlaybackChannel),
			minChoicesForSearch: 0,
		},
	]
}

export function getActions(numberOfInputs, numberOfZones) {
	const { companion, state, tcpClient } = getContext()
	let actions = {}

	// MUTE ACTIONS //

	actions[ActionId.MuteInput] = {
		name: 'Mute Input',
		options: muteOptions('Input', numberOfInputs, -1),
		callback: async (action) => {
			let inputNumber = parseInt(action.options.mute_number)
			let mute = action.options.mute

			console.log('Send mute command -- Input: ', action.options.mute_number, action.options.mute)
			let buffers = [Buffer.from([0x90, inputNumber, action.options.mute ? 0x7f : 0x3f, 0x90, inputNumber, 0])]
			tcpClient.queue(buffers)

			// buffers = requestMuteInfo(ChannelType.Input, action.options.mute_number)
			// console.log('Request mute info -- Input: ', buffers, action.options.mute_number)
			// tcpClient.queue(buffers)

			state.setChannel(ChannelType.Input, inputNumber, undefined, mute)
			console.log('checking feedback inputMute')
			companion.checkFeedbacks(FeedbackId.InputMute)
		},
	}

	actions[ActionId.MuteZone] = {
		name: 'Mute Zone',
		options: muteOptions('Zone', numberOfInputs, -1),
		callback: (action) => {
			let zoneNumber = parseInt(action.options.mute_number)
			let mute = action.options.mute

			console.log('Send mute command -- Input: ', action.options.mute_number, action.options.mute)
			let buffers = [Buffer.from([0x91, zoneNumber, action.options.mute ? 0x7f : 0x3f, 0x91, zoneNumber, 0])]
			tcpClient.queue(buffers)

			// buffers = requestMuteInfo(ChannelType.Zone, action.options.mute_number)
			// console.log('Request mute info -- Zone: ', buffers, action.options.mute_number)
			// tcpClient.queue(buffers)

			state.setChannel(ChannelType.Zone, zoneNumber, undefined, mute)
			console.log('checking feedback zoneMute')
			companion.checkFeedbacks(FeedbackId.ZoneMute)
		},
	}

	actions[ActionId.MuteControlGroup] = {
		name: 'Mute Control Group',
		options: muteOptions('Control Group', 32, -1),
		callback: async (action) => {
			let cgNumber = parseInt(action.options.mute_number)
			let mute = action.options.mute
			let buffers = [Buffer.from([0x92, cgNumber, action.options.mute ? 0x7f : 0x3f, 0x91, cgNumber, 0])]
			tcpClient.queue(buffers)

			// buffers = requestMuteInfo(ChannelType.ControlGroup, action.options.mute_number)
			// console.log('Request mute info -- Control Group: ', buffers, action.options.mute_number)
			// tcpClient.queue(buffers)

			state.setChannel(ChannelType.ControlGroup, cgNumber, undefined, mute)
			companion.checkFeedbacks(FeedbackId.ControlGroupMute)
		},
	}

	actions[ActionId.MuteInputToZone] = {
		name: 'Mute Input to Zone',
		options: muteOptions('Input', numberOfInputs, -1).concat(listOptions('Zone', numberOfZones, -1)),
		callback: (action) => {
			let inputNumber = parseInt(action.options.mute_number)
			let zoneNumber = parseInt(action.options.number)
			tcpClient.queue(setInputToZoneMute(inputNumber, zoneNumber, action.options.mute))

			// manually update internal state
			state.setSend(ChannelType.Input, inputNumber, zoneNumber, undefined, action.options.mute)
			companion.checkFeedbacks(FeedbackId.InputToZoneMute)

			console.log(inputNumber, zoneNumber, SendInfoType.MUTE)
			setTimeout(() => {
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputNumber, zoneNumber))
			}, 200)
		},
	}

	// LEVEL ACTIONS //

	actions[ActionId.SetInputLevel] = {
		name: 'Set Level of Input',
		options: setLevelOptions('Input', numberOfInputs, -1),
		callback: (action) => {
			console.log("Sending level set request, " + action.options.setlvl_ch_number + Date.now())
			tcpClient.queue(setLevelCallback(action, ChannelType.Input))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Input, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustInputLevel] = {
		name: 'Increment/Decrement Level of Input',
		options: incDecOptions('Input', numberOfInputs, -1),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.Input))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Input, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.SetZoneLevel] = {
		name: 'Set Level of Zone',
		options: [
			{
				type: 'dropdown',
				id: 'setlvl_ch_number',
				label: 'Zone',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfZones, -1),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				id: 'level',
				label: 'Set Level (dBu)',
				default: '0',
				choices: getChoicesArrayOf1DArray(dbu_Values),
			},
		],
		callback: (action) => {
			tcpClient.queue(setLevelCallback(action, ChannelType.Zone))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustZoneLevel] = {
		name: 'Increment/Decrement Level of Zone',
		options: incDecOptions('Zone', numberOfZones, -1),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.Zone))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.SetControlGroupLevel] = {
		name: 'Set Level of Control Group',
		options: setLevelOptions('Control Group', 32, -1),
		callback: (action) => {
			tcpClient.queue(setLevelCallback(action, ChannelType.ControlGroup))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustControlGroupLevel] = {
		name: 'Increment/Decrement Level of Control Group',
		options: incDecOptions('Control Group', 32, -1),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.ControlGroup))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustInputToZoneSendLevel] = {
		name: 'Increment/Decrement Input to Zone Send Level',
		options: incDecOptions('Input', numberOfInputs, -1).concat(listOptions('Zone', numberOfZones, -1)),
		callback: (action) => {
			tcpClient.queue(incDecSendLevelCallback(action, SendType.InputToZone))
			setTimeout(() => {
				tcpClient.queue(
					requestSendInfo(
						SendType.InputToZone,
						SendInfoType.LEVEL,
						parseInt(action.options.incdec_ch_number),
						parseInt(action.options.number),
					),
				)
			}, 200)
		},
	}

	actions[ActionId.AdjustZoneToZoneSendLevel] = {
		name: 'Increment/Decrement Zone to Zone Send Level',
		options: incDecOptions('Zone', numberOfZones, -1).concat(listOptions('Zone', numberOfZones, -1)),
		callback: (action) => {
			tcpClient.queue(incDecSendLevelCallback(action, SendType.ZoneToZone))
			setTimeout(() => {
				tcpClient.queue(
					requestSendInfo(
						SendType.ZoneToZone,
						SendInfoType.LEVEL,
						parseInt(action.options.incdec_ch_number),
						parseInt(action.options.number),
					),
				)				
			}, 200)
		},
	}

	// PRESET ACTIONS //

	actions[ActionId.RecallPreset] = {
		name: 'Recall Preset',
		options: listOptions('Preset', PRESET_COUNT, -1),
		callback: (action) => {
			// note: presetNumber is one less than the actual preset number, since the action list starts at 0
			let presetNumber = parseInt(action.options.number)
			let bank = Math.floor(presetNumber / 128)
			let presetOffset = presetNumber % 128
			let buffers = [Buffer.from([0xb0, 0x00, bank, 0xc0, presetOffset])]
			tcpClient.queue(buffers)
		},
	}

	// PLAYBACK ACTIONS //

	actions[ActionId.PlaybackTrack] = {
		name: 'Playback Track',
		options: listOptions('Playback Track', PLAYBACK_COUNT, -1).concat(playbackChannelOptions('Playback Channel')),
		callback: (action) => {
			let trackNumber = parseInt(action.options.number)
			let playbackChannel = parseInt(action.options.playbackChannel)

			// console.log(`action playback_track: Got Callback with parameters trackNumber: ${action.options.number} and playbackChannel ${action.options.playbackChannel}.`)

			tcpClient.queue(setPlaybackTrack(trackNumber, playbackChannel))
		},
	}

	return actions
}
