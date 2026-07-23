import { Colors, SendType, ChannelType, SendInfoType } from './utility/constants.js'
import { getDbuValue } from './utility/helpers.js'
import { requestSendInfo } from './formatMIDI/sends.js'
import { requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'
import { getContext } from './context.js'
import { createLogger } from './utility/log.js'

const PRESET_COUNT = 500
const ENABLE_FEEDBACK_LOGGING = false
const log = createLogger('Feedback')
const debug = (event, values) => {
	if (ENABLE_FEEDBACK_LOGGING) log.debug(event, values)
}

export const FeedbackId = {
	InputMute: 'inputMute',
	InputLevel: 'inputLevel',
	ZoneMute: 'zoneMute',
	ZoneLevel: 'zoneLevel',
	ControlGroupMute: 'cgMute',
	ControlGroupLevel: 'cgLevel',
	InputToZoneMute: 'inputToZoneMute',
	InputToZoneLevel: 'inputToZoneLevel',
	CurrentPreset: 'currentPreset',
}

/**
 * @typedef {typeof FeedbackId[keyof typeof FeedbackId]} FeedbackId
 */

/**
 * Builds a number input field for Companion Feedbacks.
 * @param {String} name - The label of the field
 * @param {String} id - The id of the field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function generateNumberOptions(name, id, max) {
	return [
		{
			type: 'number',
			label: name,
			id,
			default: 1,
			min: 1,
			max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
		},
	]
}

export function getFeedbacks(numberOfInputs, numberOfZones, numberOfControlGroups) {
	const { tcpClient, state } = getContext()
	const feedbacks = {}

	feedbacks[FeedbackId.InputMute] = {
		type: 'boolean',
		name: 'Input Mute',
		description: 'Change background when input on mute',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
		},
		options: generateNumberOptions('Input', 'input', numberOfInputs),
		callback: (feedback, context) => {
			let inputNum = feedback.options.input

			state.addChannel(ChannelType.Input, inputNum, feedback.id, FeedbackId.InputMute)

			let muteState = state.getMute(ChannelType.Input, inputNum)
			debug(`(Callback) ${FeedbackId.InputMute}`, { input: inputNum, state: muteState, feedbackId: feedback.id })

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputNum = feedback.options.input
			debug(`(Unsubscribe) ${FeedbackId.InputMute}`, { input: inputNum, feedbackId: feedback.id })

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.InputLevel] = {
		type: 'value',
		name: 'Input Level',
		description: 'Returns level of input in dBu',
		options: generateNumberOptions('Input', 'input', numberOfInputs),
		callback: (feedback, bank) => {
			let inputNum = feedback.options.input

			const { isNew } = state.addChannel(ChannelType.Input, inputNum, feedback.id, FeedbackId.InputLevel)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestLevelInfo(ChannelType.Input, inputNum))
				tcpClient.queue(requestMuteInfo(ChannelType.Input, inputNum))
			}

			let levelDec = state.getLevel(ChannelType.Input, inputNum)
			debug(`(Callback) ${FeedbackId.InputLevel}`, {
				input: inputNum,
				level: levelDec,
				isNew,
				feedbackId: feedback.id,
			})

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputNum = feedback.options.input
			debug(`(Unsubscribe) ${FeedbackId.InputLevel}`, { input: inputNum, feedbackId: feedback.id })

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.ZoneMute] = {
		type: 'boolean',
		name: 'Zone Mute',
		description: 'Change background when zone on mute',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
		},
		options: generateNumberOptions('Zone', 'zone', numberOfZones),
		callback: (feedback, bank) => {
			let zoneNum = feedback.options.zone

			state.addChannel(ChannelType.Zone, zoneNum, feedback.id, FeedbackId.ZoneMute)

			let muteState = state.getMute(ChannelType.Zone, zoneNum)
			debug(`(Callback) ${FeedbackId.ZoneMute}`, { zone: zoneNum, state: muteState, feedbackId: feedback.id })

			return muteState
		},
		unsubscribe: (feedback) => {
			let zoneNum = feedback.options.zone
			debug(`(Unsubscribe) ${FeedbackId.ZoneMute}`, { zone: zoneNum, feedbackId: feedback.id })

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.ZoneLevel] = {
		type: 'value',
		name: 'Zone Level',
		description: 'Returns level of zone in dBu',
		options: generateNumberOptions('Zone', 'zone', numberOfZones),
		callback: (feedback, bank) => {
			let zoneNum = feedback.options.zone

			const { isNew } = state.addChannel(ChannelType.Zone, zoneNum, feedback.id, FeedbackId.ZoneLevel)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, zoneNum))
				tcpClient.queue(requestMuteInfo(ChannelType.Zone, zoneNum))
			}

			let levelDec = state.getLevel(ChannelType.Zone, zoneNum)
			debug(`(Callback) ${FeedbackId.ZoneLevel}`, { zone: zoneNum, level: levelDec, isNew, feedbackId: feedback.id })

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let zoneNum = feedback.options.zone
			debug(`(Unsubscribe) ${FeedbackId.ZoneLevel}`, { zone: zoneNum, feedbackId: feedback.id })

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.ControlGroupMute] = {
		type: 'boolean',
		name: 'Control Group Mute',
		description: 'Change background when control group on mute',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
		},
		options: generateNumberOptions('Control Group', 'cg', numberOfControlGroups),
		callback: (feedback, bank) => {
			let controlGroupNum = feedback.options.cg

			state.addChannel(ChannelType.ControlGroup, controlGroupNum, feedback.id, FeedbackId.ControlGroupMute)

			let muteState = state.getMute(ChannelType.ControlGroup, controlGroupNum)
			debug(`(Callback) ${FeedbackId.ControlGroupMute}`, {
				controlGroup: controlGroupNum,
				state: muteState,
				feedbackId: feedback.id,
			})

			return muteState
		},
		unsubscribe: (feedback) => {
			let controlGroupNum = feedback.options.cg
			debug(`(Unsubscribe) ${FeedbackId.ControlGroupMute}`, {
				controlGroup: controlGroupNum,
				feedbackId: feedback.id,
			})

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.ControlGroupLevel] = {
		type: 'value',
		name: 'Control Group Level',
		description: 'Returns level of control group in dBu',
		options: generateNumberOptions('Control Group', 'cg', numberOfControlGroups),
		callback: (feedback, bank) => {
			let controlGroupNum = feedback.options.cg

			const { isNew } = state.addChannel(
				ChannelType.ControlGroup,
				controlGroupNum,
				feedback.id,
				FeedbackId.ControlGroupLevel,
			)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, controlGroupNum))
				tcpClient.queue(requestMuteInfo(ChannelType.ControlGroup, controlGroupNum))
			}

			let levelDec = state.getLevel(ChannelType.ControlGroup, controlGroupNum)
			debug(`(Callback) ${FeedbackId.ControlGroupLevel}`, {
				controlGroup: controlGroupNum,
				level: levelDec,
				isNew,
				feedbackId: feedback.id,
			})

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let controlGroupNum = feedback.options.cg
			debug(`(Unsubscribe) ${FeedbackId.ControlGroupLevel}`, {
				controlGroup: controlGroupNum,
				feedbackId: feedback.id,
			})

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.InputToZoneMute] = {
		type: 'boolean',
		name: 'Input to Zone - Mute',
		description: 'Change background when input to zone on mute',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
		},
		options: generateNumberOptions('Input', 'input', numberOfInputs).concat(
			generateNumberOptions('Zone', 'zone', numberOfZones),
		),
		callback: (feedback, bank) => {
			let inputNum = feedback.options.input
			let zoneNum = feedback.options.zone

			state.addSend(ChannelType.Input, inputNum, zoneNum, feedback.id, FeedbackId.InputToZoneMute)

			let muteState = state.getSendMute(ChannelType.Input, inputNum, zoneNum)
			debug(`(Callback) ${FeedbackId.InputToZoneMute}`, {
				input: inputNum,
				zone: zoneNum,
				mute: muteState,
				feedbackId: feedback.id,
			})

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputNum = feedback.options.input
			let zoneNum = feedback.options.zone
			debug(`(Unsubscribe) ${FeedbackId.InputToZoneMute}`, {
				input: inputNum,
				zone: zoneNum,
				feedbackId: feedback.id,
			})

			state.removeSend(feedback.id)
		},
	}

	feedbacks[FeedbackId.InputToZoneLevel] = {
		type: 'value',
		name: 'Input to Zone - Level',
		description: 'Returns value of input sent to zone',
		options: generateNumberOptions('Input', 'input', numberOfInputs).concat(
			generateNumberOptions('Zone', 'zone', numberOfZones),
		),
		callback: (feedback, bank) => {
			let inputNum = feedback.options.input
			let zoneNum = feedback.options.zone

			const { isNew } = state.addSend(ChannelType.Input, inputNum, zoneNum, feedback.id, FeedbackId.InputToZoneLevel)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.LEVEL, inputNum, zoneNum))
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputNum, zoneNum))
			}

			let levelDec = state.getSendLevel(ChannelType.Input, inputNum, zoneNum)
			debug(`(Callback) ${FeedbackId.InputToZoneLevel}`, {
				inputNum,
				zoneNum,
				level: levelDec,
				feedbackId: feedback.id,
			})

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputNum = feedback.options.input
			let zoneNum = feedback.options.zone
			debug(`(Unsubscribe) ${FeedbackId.InputToZoneLevel}`, {
				input: inputNum,
				zone: zoneNum,
				feedbackId: feedback.id,
			})

			state.removeSend(feedback.id)
		},
	}

	feedbacks[FeedbackId.CurrentPreset] = {
		type: 'boolean',
		name: 'Active Preset',
		description: 'Feedback when a specific preset has been recalled',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Blue,
		},
		options: generateNumberOptions('Preset', 'preset', PRESET_COUNT),
		callback: (feedback) => {
			let currentPreset = state.getPreset()
			debug(`(Callback) ${FeedbackId.CurrentPreset}`, {
				currentPreset,
				feedbackPreset: feedback.options.preset,
				feedbackId: feedback.id,
			})

			return currentPreset == feedback.options.preset
		},
	}

	return feedbacks
}
