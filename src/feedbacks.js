import { Colors, SendType, ChannelType, SendInfoType } from './utility/constants.js'
import { getDbuValue, getChoicesArrayWithIncrementingNumbers } from './utility/helpers.js'
import { requestSendInfo } from './formatMIDI/sends.js'
import { requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'
import { getContext } from './context.js'

const LOG_PREFIX = '[Feedback]'
const log = (message) => console.log(`${LOG_PREFIX} ${message}`)

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

export function getFeedbacks(numberOfIO) {
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
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfIO, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, context) => {
			let inputId = parseInt(feedback.options.input)

			state.addChannel(ChannelType.Input, inputId, feedback.id, FeedbackId.InputMute)

			let muteState = state.getMute(ChannelType.Input, inputId)
			log(`${FeedbackId.InputMute} callback -- ID: ${feedback.id}, input: ${inputId + 1}, state: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			log(`${FeedbackId.InputMute} unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}`)

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
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfIO, -1),
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
			log(`${FeedbackId.InputLevel} callback -- ID: ${feedback.id}, input: ${inputId + 1}, level (dec): ${levelDec}, isNew: ${isNew}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			log(`${FeedbackId.InputLevel} unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}`)

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
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfIO, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let zoneId = parseInt(feedback.options.zone)

			state.addChannel(ChannelType.Zone, zoneId, feedback.id, FeedbackId.ZoneMute)

			let muteState = state.getMute(ChannelType.Zone, zoneId)
			log(`${FeedbackId.ZoneMute} callback -- ID: ${feedback.id}, zone: ${zoneId + 1}, state: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			log(`${FeedbackId.ZoneMute} unsubscribe -- ID: ${feedback.id}, zone: ${zoneId + 1}`)

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
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfIO, -1),
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
			log(`${FeedbackId.ZoneLevel} callback -- ID: ${feedback.id}, zone: ${zoneId + 1}, level (dec): ${levelDec}, isNew: ${isNew}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			log(`${FeedbackId.ZoneLevel} unsubscribe -- ID: ${feedback.id}, zone: ${zoneId + 1}`)

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
				choices: getChoicesArrayWithIncrementingNumbers('Control Group', 32, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let controlGroupId = parseInt(feedback.options.cg)

			state.addChannel(ChannelType.ControlGroup, controlGroupId, feedback.id, FeedbackId.ControlGroupMute)

			let muteState = state.getMute(ChannelType.ControlGroup, controlGroupId)
			log(`${FeedbackId.ControlGroupMute} callback -- ID: ${feedback.id}, control group: ${controlGroupId + 1}, state: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			log(`${FeedbackId.ControlGroupMute} unsubscribe -- ID: ${feedback.id}, control group: ${controlGroupId + 1}`)

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
				choices: getChoicesArrayWithIncrementingNumbers('Control Group', 32, -1),
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
			log(`${FeedbackId.ControlGroupLevel} callback -- ID: ${feedback.id}, CG: ${controlGroupId + 1}, level: ${levelDec}, new: ${isNew}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			log(`${FeedbackId.ControlGroupLevel} unsubscribe -- ID: ${feedback.id}, control group: ${controlGroupId + 1}`)

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
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfIO, -1),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				id: 'zone',
				label: 'Zone',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfIO, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)

			state.addSend(ChannelType.Input, inputId, zoneId, feedback.id, FeedbackId.InputToZoneMute)

			let muteState = state.getSendMute(ChannelType.Input, inputId, zoneId)
			log(`${FeedbackId.InputToZoneMute} callback -- ID: ${feedback.id}, input: ${inputId + 1}, zone: ${zoneId + 1}, mute: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			log(`${FeedbackId.InputToZoneMute} unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}, zone: ${zoneId + 1}`)

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
				choices: getChoicesArrayWithIncrementingNumbers('Input', numberOfIO, -1),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				id: 'zone',
				label: 'Zone',
				default: 0,
				choices: getChoicesArrayWithIncrementingNumbers('Zone', numberOfIO, -1),
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback, bank) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)

			const { isNew } = state.addSend(
				ChannelType.Input,
				inputId,
				zoneId,
				feedback.id,
				FeedbackId.InputToZoneLevel,
			)
			if (isNew) {
				// If new, immediately request info
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.LEVEL, inputId, zoneId))
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputId, zoneId))
			}

			let levelDec = state.getSendLevel(ChannelType.Input, inputId, zoneId)
			log(`${FeedbackId.InputToZoneLevel} callback -- ID: ${feedback.id}, input ID: ${inputId}, zone ID: ${zoneId}, level: ${levelDec}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			log(`${FeedbackId.InputToZoneLevel} unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}, zone: ${zoneId + 1}`)

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
			log(`${FeedbackId.CurrentPreset} callback -- ID: ${feedback.id}, current: ${currentPreset}, feedback: ${feedback.options.preset}`)

			return currentPreset == feedback.options.preset
		},
	}

	return feedbacks
}
