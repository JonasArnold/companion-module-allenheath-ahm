import { getChoicesArrayOf1DArray, getChoicesArrayOfKeyValueObject } from './utility/helpers.js'
import { ChannelType, SendType, SendInfoType, dbu_Values, PlaybackChannel } from './utility/constants.js'
import { setLevelCallback, incDecLevelCallback, requestLevelInfo } from './formatMIDI/channels.js'
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
 * Builds a number input field for Companion Actions.
 * Id of the field will be 'number'.
 * @param {String} label - The label of the field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function listOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
		},
	]
}

/**
 * Builds Companion Action Options for mute actions.
 * Id of the number field will be 'mute_number'.
 * Id of the mute checkbox field will be 'mute'.
 * @param {String} label - The label of the number field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function muteOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'mute_number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
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
 * Id of the number field will be 'setlvl_ch_number'.
 * Id of the level dropdown field will be 'level'.
 * @param {String} label - The label of the number field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function setLevelOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'setlvl_ch_number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
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
 * Id of the number field will be 'incdec_ch_number'.
 * Id of the increment/decrement checkbox will be 'incdec'.
 * @param {String} label - The label of the number field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function incDecOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'incdec_ch_number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
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
 * @param {String} label - leading text for dropdown options
 * @returns {Object[]}
 */
function playbackChannelOptions(label) {
	return [
		{
			type: 'dropdown',
			id: 'playbackChannel',
			label,
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
		options: muteOptions('Input', numberOfInputs),
		callback: async (action) => {
			let inputNum = action.options.mute_number
			let mute = action.options.mute

			log.debug(ActionId.MuteInput, { inputNum, mute })
			let buffers = [Buffer.from([0x90, inputNum - 1, action.options.mute ? 0x7f : 0x3f, 0x90, inputNum - 1, 0])]
			tcpClient.queue(buffers)

			state.setChannel(ChannelType.Input, inputNum, undefined, mute)
			companion.checkFeedbacks(FeedbackId.InputMute)
		},
	}

	actions[ActionId.MuteZone] = {
		name: 'Mute Zone',
		options: muteOptions('Zone', numberOfZones),
		callback: (action) => {
			let zoneNum = action.options.mute_number
			let mute = action.options.mute

			log.debug(ActionId.MuteZone, { zoneNum, mute })
			let buffers = [Buffer.from([0x91, zoneNum - 1, action.options.mute ? 0x7f : 0x3f, 0x91, zoneNum - 1, 0])]
			tcpClient.queue(buffers)

			state.setChannel(ChannelType.Zone, zoneNum, undefined, mute)
			companion.checkFeedbacks(FeedbackId.ZoneMute)
		},
	}

	actions[ActionId.MuteControlGroup] = {
		name: 'Mute Control Group',
		options: muteOptions('Control Group', numberOfControlGroups),
		callback: async (action) => {
			let cgNum = action.options.mute_number
			let mute = action.options.mute

			log.debug(ActionId.MuteControlGroup, { cgNum, mute })
			let buffers = [Buffer.from([0x92, cgNum - 1, action.options.mute ? 0x7f : 0x3f, 0x92, cgNum - 1, 0])]
			tcpClient.queue(buffers)

			state.setChannel(ChannelType.ControlGroup, cgNum, undefined, mute)
			companion.checkFeedbacks(FeedbackId.ControlGroupMute)
		},
	}

	actions[ActionId.MuteInputToZone] = {
		name: 'Mute Input to Zone',
		options: muteOptions('Input', numberOfInputs).concat(listOptions('Zone', numberOfZones)),
		callback: (action) => {
			let inputNum = action.options.mute_number
			let zoneNum = action.options.number

			log.debug(ActionId.MuteInputToZone, { inputNum, zoneNum, infoType: SendInfoType.MUTE })
			tcpClient.queue(setInputToZoneMute(inputNum, zoneNum, action.options.mute))

			// manually update internal state
			state.setSend(ChannelType.Input, inputNum, zoneNum, undefined, action.options.mute)
			companion.checkFeedbacks(FeedbackId.InputToZoneMute)

			setTimeout(() => {
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputNum, zoneNum))
			}, 200)
		},
	}

	// LEVEL ACTIONS //

	actions[ActionId.SetInputLevel] = {
		name: 'Set Level of Input',
		options: setLevelOptions('Input', numberOfInputs),
		callback: (action) => {
			log.debug(ActionId.SetInputLevel, { inputNum: action.options.setlvl_ch_number, level: action.options.level })
			tcpClient.queue(setLevelCallback(action, ChannelType.Input))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Input, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustInputLevel] = {
		name: 'Increment/Decrement Level of Input',
		options: incDecOptions('Input', numberOfInputs),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.Input))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Input, action.options.incdec_ch_number))
			}, 200)
		},
	}

	actions[ActionId.SetZoneLevel] = {
		name: 'Set Level of Zone',
		options: setLevelOptions('Zone', numberOfZones),
		callback: (action) => {
			log.debug(ActionId.SetZoneLevel, { zoneNum: action.options.setlvl_ch_number, level: action.options.level })
			tcpClient.queue(setLevelCallback(action, ChannelType.Zone))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustZoneLevel] = {
		name: 'Increment/Decrement Level of Zone',
		options: incDecOptions('Zone', numberOfZones),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.Zone))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, action.options.incdec_ch_number))
			}, 200)
		},
	}

	actions[ActionId.SetControlGroupLevel] = {
		name: 'Set Level of Control Group',
		options: setLevelOptions('Control Group', numberOfControlGroups),
		callback: (action) => {
			log.debug(ActionId.SetControlGroupLevel, {
				controlGroupNum: action.options.setlvl_ch_number,
				level: action.options.level,
			})
			tcpClient.queue(setLevelCallback(action, ChannelType.ControlGroup))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, action.options.setlvl_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustControlGroupLevel] = {
		name: 'Increment/Decrement Level of Control Group',
		options: incDecOptions('Control Group', numberOfControlGroups),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.ControlGroup))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, action.options.incdec_ch_number))
			}, 200)
		},
	}

	actions[ActionId.AdjustInputToZoneSendLevel] = {
		name: 'Increment/Decrement Input to Zone Send Level',
		options: incDecOptions('Input', numberOfInputs).concat(listOptions('Zone', numberOfZones)),
		callback: (action) => {
			tcpClient.queue(incDecSendLevelCallback(action, SendType.InputToZone))
			setTimeout(() => {
				tcpClient.queue(
					requestSendInfo(
						SendType.InputToZone,
						SendInfoType.LEVEL,
						action.options.incdec_ch_number,
						action.options.number,
					),
				)
			}, 200)
		},
	}

	actions[ActionId.AdjustZoneToZoneSendLevel] = {
		name: 'Increment/Decrement Zone to Zone Send Level',
		options: incDecOptions('Zone', numberOfZones).concat(listOptions('Zone', numberOfZones)),
		callback: (action) => {
			tcpClient.queue(incDecSendLevelCallback(action, SendType.ZoneToZone))
			setTimeout(() => {
				tcpClient.queue(
					requestSendInfo(
						SendType.ZoneToZone,
						SendInfoType.LEVEL,
						action.options.incdec_ch_number,
						action.options.number,
					),
				)
			}, 200)
		},
	}

	// PRESET ACTIONS //

	actions[ActionId.RecallPreset] = {
		name: 'Recall Preset',
		options: listOptions('Preset', PRESET_COUNT),
		callback: (action) => {
			// subtract 1 to calculate the 0-indexed preset number for the MIDI command
			let presetId = action.options.number - 1
			let bank = Math.floor(presetId / 128)
			let presetOffset = presetId % 128
			let buffers = [Buffer.from([0xb0, 0x00, bank, 0xc0, presetOffset])]
			tcpClient.queue(buffers)
		},
	}

	// PLAYBACK ACTIONS //

	actions[ActionId.PlaybackTrack] = {
		name: 'Playback Track',
		options: listOptions('Playback Track', PLAYBACK_COUNT).concat(playbackChannelOptions('Playback Channel')),
		callback: (action) => {
			let trackNum = action.options.number
			let playbackChannel = action.options.playbackChannel

			tcpClient.queue(setPlaybackTrack(trackNum, playbackChannel))
		},
	}

	return actions
}
