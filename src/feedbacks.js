import { Colors, SendType, ChannelType, SendInfoType } from './utility/constants.js'
import { getDbuValue, getChoicesArrayWithIncrementingNumbers } from './utility/helpers.js'
import { requestSendInfo } from './formatMIDI/sends.js'
import { requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'
import { getContext } from './context.js'
import { createLogger } from './utility/log.js'

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
		options: [
			{
				type: 'dropdown',
				id: 'input',
				label: 'Input',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfInputs, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, context) => {
			let inputId = parseInt(feedback.options.input)

			state.addChannel(ChannelType.Input, inputId, feedback.id, FeedbackId.InputMute)

			let muteState = state.getMute(ChannelType.Input, inputId)
			debug(`(Callback) ${FeedbackId.InputMute}`, { input: inputId + 1, state: muteState, feedbackId: feedback.id })

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			debug(`(Unsubscribe) ${FeedbackId.InputMute}`, { input: inputId + 1, feedbackId: feedback.id })

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.InputLevel] = {
		type: 'value',
		name: 'Input Level',
		description: 'Returns level of input in dBu',
		options: [
			{
				type: 'dropdown',
				id: 'input',
				label: 'Input',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfInputs, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let inputId = parseInt(feedback.options.input)

			const { isNew } = state.addChannel(ChannelType.Input, inputId, feedback.id, FeedbackId.InputLevel)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestLevelInfo(ChannelType.Input, inputId))
				tcpClient.queue(requestMuteInfo(ChannelType.Input, inputId))
			}

			let levelDec = state.getLevel(ChannelType.Input, inputId)
			debug(`(Callback) ${FeedbackId.InputLevel}`, {
				input: inputId + 1,
				level: levelDec,
				isNew,
				feedbackId: feedback.id,
			})

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			debug(`(Unsubscribe) ${FeedbackId.InputLevel}`, { input: inputId + 1, feedbackId: feedback.id })

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
		options: [
			{
				type: 'dropdown',
				id: 'zone',
				label: 'Zone',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfZones, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let zoneId = parseInt(feedback.options.zone)

			state.addChannel(ChannelType.Zone, zoneId, feedback.id, FeedbackId.ZoneMute)

			let muteState = state.getMute(ChannelType.Zone, zoneId)
			debug(`(Callback) ${FeedbackId.ZoneMute}`, { zone: zoneId + 1, state: muteState, feedbackId: feedback.id })

			return muteState
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			debug(`(Unsubscribe) ${FeedbackId.ZoneMute}`, { zone: zoneId + 1, feedbackId: feedback.id })

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.ZoneLevel] = {
		type: 'value',
		name: 'Zone Level',
		description: 'Returns level of zone in dBu',
		options: [
			{
				type: 'dropdown',
				id: 'zone',
				label: 'Zone',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfZones, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let zoneId = parseInt(feedback.options.zone)

			const { isNew } = state.addChannel(ChannelType.Zone, zoneId, feedback.id, FeedbackId.ZoneLevel)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, zoneId))
				tcpClient.queue(requestMuteInfo(ChannelType.Zone, zoneId))
			}

			let levelDec = state.getLevel(ChannelType.Zone, zoneId)
			debug(`(Callback) ${FeedbackId.ZoneLevel}`, { zone: zoneId + 1, level: levelDec, isNew, feedbackId: feedback.id })

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			debug(`(Unsubscribe) ${FeedbackId.ZoneLevel}`, { zone: zoneId + 1, feedbackId: feedback.id })

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
		options: [
			{
				type: 'dropdown',
				id: 'cg',
				label: 'Control Group',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Control Group', numberOfControlGroups, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let controlGroupId = parseInt(feedback.options.cg)

			state.addChannel(ChannelType.ControlGroup, controlGroupId, feedback.id, FeedbackId.ControlGroupMute)

			let muteState = state.getMute(ChannelType.ControlGroup, controlGroupId)
			debug(`(Callback) ${FeedbackId.ControlGroupMute}`, {
				controlGroup: controlGroupId + 1,
				state: muteState,
				feedbackId: feedback.id,
			})

			return muteState
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			debug(`(Unsubscribe) ${FeedbackId.ControlGroupMute}`, {
				controlGroup: controlGroupId + 1,
				feedbackId: feedback.id,
			})

			state.removeChannel(feedback.id)
		},
	}

	feedbacks[FeedbackId.ControlGroupLevel] = {
		type: 'value',
		name: 'Control Group Level',
		description: 'Returns level of control group in dBu',
		options: [
			{
				type: 'dropdown',
				id: 'cg',
				label: 'Control Group',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Control Group', numberOfControlGroups, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let controlGroupId = parseInt(feedback.options.cg)

			const { isNew } = state.addChannel(
				ChannelType.ControlGroup,
				controlGroupId,
				feedback.id,
				FeedbackId.ControlGroupLevel,
			)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, controlGroupId))
				tcpClient.queue(requestMuteInfo(ChannelType.ControlGroup, controlGroupId))
			}

			let levelDec = state.getLevel(ChannelType.ControlGroup, controlGroupId)
			debug(`(Callback) ${FeedbackId.ControlGroupLevel}`, {
				controlGroup: controlGroupId + 1,
				level: levelDec,
				isNew,
				feedbackId: feedback.id,
			})

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			debug(`(Unsubscribe) ${FeedbackId.ControlGroupLevel}`, {
				controlGroup: controlGroupId + 1,
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
		options: [
			{
				type: 'dropdown',
				id: 'input',
				label: 'Input',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfInputs, -1),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				id: 'zone',
				label: 'Zone',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfZones, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)

			state.addSend(ChannelType.Input, inputId, zoneId, feedback.id, FeedbackId.InputToZoneMute)

			let muteState = state.getSendMute(ChannelType.Input, inputId, zoneId)
			debug(`(Callback) ${FeedbackId.InputToZoneMute}`, {
				input: inputId + 1,
				zone: zoneId + 1,
				mute: muteState,
				feedbackId: feedback.id,
			})

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			debug(`(Unsubscribe) ${FeedbackId.InputToZoneMute}`, {
				input: inputId + 1,
				zone: zoneId + 1,
				feedbackId: feedback.id,
			})

			state.removeSend(feedback.id)
		},
	}

	feedbacks[FeedbackId.InputToZoneLevel] = {
		type: 'value',
		name: 'Input to Zone - Level',
		description: 'Returns value of input sent to zone',
		options: [
			{
				type: 'dropdown',
				id: 'input',
				label: 'Input',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfInputs, -1),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				id: 'zone',
				label: 'Zone',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfZones, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)

			const { isNew } = state.addSend(ChannelType.Input, inputId, zoneId, feedback.id, FeedbackId.InputToZoneLevel)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.LEVEL, inputId, zoneId))
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputId, zoneId))
			}

			let levelDec = state.getSendLevel(ChannelType.Input, inputId, zoneId)
			debug(`(Callback) ${FeedbackId.InputToZoneLevel}`, { inputId, zoneId, level: levelDec, feedbackId: feedback.id })

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			debug(`(Unsubscribe) ${FeedbackId.InputToZoneLevel}`, {
				input: inputId + 1,
				zone: zoneId + 1,
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
		options: [
			{
				type: 'textinput',
				label: 'Preset number',
				id: 'preset',
				useVariables: true,
				default: 1,
			},
		],
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
