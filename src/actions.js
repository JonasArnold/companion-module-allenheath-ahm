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
import { createLogger } from './utility/log.js'

const PRESET_COUNT = 500
const PLAYBACK_COUNT = 127
const log = createLogger('Actions')

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

export function getActions(numberOfInputs, numberOfZones, numberOfControlGroups) {
	const { companion, state, tcpClient } = getContext()
	let actions = {}

	// MUTE ACTIONS //

	actions[ActionId.MuteInput] = {
		name: 'Mute Input',
		options: muteOptions('Input', numberOfInputs, -1),
		callback: async (action) => {
			let inputId = parseInt(action.options.mute_number)
			let mute = action.options.mute

			log.debug(ActionId.MuteInput, { inputId: inputId, mute })
			let buffers = [Buffer.from([0x90, inputId, action.options.mute ? 0x7f : 0x3f, 0x90, inputId, 0])]
			tcpClient.queue(buffers)

			state.setChannel(ChannelType.Input, inputId, undefined, mute)
			companion.checkFeedbacks(FeedbackId.InputMute)
		},
	}

	actions[ActionId.MuteZone] = {
		name: 'Mute Zone',
		options: muteOptions('Zone', numberOfZones, -1),
		callback: (action) => {
			let zoneId = parseInt(action.options.mute_number)
			let mute = action.options.mute

			log.debug(ActionId.MuteZone, { zoneId: zoneId, mute })
			let buffers = [Buffer.from([0x91, zoneId, action.options.mute ? 0x7f : 0x3f, 0x91, zoneId, 0])]
			tcpClient.queue(buffers)

			state.setChannel(ChannelType.Zone, zoneId, undefined, mute)
			companion.checkFeedbacks(FeedbackId.ZoneMute)
		},
	}

	actions[ActionId.MuteControlGroup] = {
		name: 'Mute Control Group',
		options: muteOptions('Control Group', numberOfControlGroups, -1),
		callback: async (action) => {
			let cgId = parseInt(action.options.mute_number)
			let mute = action.options.mute

			log.debug(ActionId.MuteControlGroup, { cgId: cgId, mute })
			let buffers = [Buffer.from([0x92, cgId, action.options.mute ? 0x7f : 0x3f, 0x92, cgId, 0])]
			tcpClient.queue(buffers)

			state.setChannel(ChannelType.ControlGroup, cgId, undefined, mute)
			companion.checkFeedbacks(FeedbackId.ControlGroupMute)
		},
	}

	actions[ActionId.MuteInputToZone] = {
		name: 'Mute Input to Zone',
		options: muteOptions('Input', numberOfInputs, -1).concat(listOptions('Zone', numberOfZones, -1)),
		callback: (action) => {
			let inputId = parseInt(action.options.mute_number)
			let zoneId = parseInt(action.options.number)

			log.debug(ActionId.MuteInputToZone, { inputId: inputId, zoneId: zoneId, infoType: SendInfoType.MUTE })
			tcpClient.queue(setInputToZoneMute(inputId, zoneId, action.options.mute))

			// manually update internal state
			state.setSend(ChannelType.Input, inputId, zoneId, undefined, action.options.mute)
			companion.checkFeedbacks(FeedbackId.InputToZoneMute)

			setTimeout(() => {
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputId, zoneId))
			}, 200)
		},
	}

	// LEVEL ACTIONS //

	actions[ActionId.SetInputLevel] = {
		name: 'Set Level of Input',
		options: setLevelOptions('Input', numberOfInputs, -1),
		callback: (action) => {
			log.debug(ActionId.SetInputLevel, { inputId: action.options.setlvl_ch_number, level: action.options.level })
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
			log.debug(ActionId.SetZoneLevel, { zoneId: action.options.setlvl_ch_number, level: action.options.level })
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
		options: setLevelOptions('Control Group', numberOfControlGroups, -1),
		callback: (action) => {
			log.debug(ActionId.SetControlGroupLevel, { controlGroupId: action.options.setlvl_ch_number, level: action.options.level })
			tcpClient.queue(setLevelCallback(action, ChannelType.ControlGroup))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustControlGroupLevel] = {
		name: 'Increment/Decrement Level of Control Group',
		options: incDecOptions('Control Group', numberOfControlGroups, -1),
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
			// note: presetId is 0-based
			let presetId = parseInt(action.options.number)
			let bank = Math.floor(presetId / 128)
			let presetOffset = presetId % 128
			let buffers = [Buffer.from([0xb0, 0x00, bank, 0xc0, presetOffset])]
			tcpClient.queue(buffers)
		},
	}

	// PLAYBACK ACTIONS //

	actions[ActionId.PlaybackTrack] = {
		name: 'Playback Track',
		options: listOptions('Playback Track', PLAYBACK_COUNT, -1).concat(playbackChannelOptions('Playback Channel')),
		callback: (action) => {
			// note: trackId is 0-based
			let trackId = parseInt(action.options.number)
			let playbackChannel = parseInt(action.options.playbackChannel)

			tcpClient.queue(setPlaybackTrack(trackId, playbackChannel))
		},
	}

	return actions
}
