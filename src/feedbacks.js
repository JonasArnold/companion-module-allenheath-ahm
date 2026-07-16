import { Colors, SendType, ChannelType, SendInfoType } from './utility/constants.js'
import { getDbuValue, getChoicesArrayWithIncrementingNumbers } from './utility/helpers.js'
import { requestSendInfo } from './formatMIDI/sends.js'
import { requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'
import { getContext } from './context.js'

const LOG_PREFIX = '[Feedback]'
const log = (message) => console.log(`${LOG_PREFIX} ${message}`)

export function getFeedbacks(numberOfIO) {
	const { tcpClient, state } = getContext()
	const feedbacks = {}

	feedbacks['inputMute'] = {
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

			state.addChannel(ChannelType.Input, inputId, feedback.id, 'inputMute')

			let muteState = state.getMute(ChannelType.Input, inputId)
			log(`inputMute callback -- ID: ${feedback.id}, input: ${inputId + 1}, state: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			log(`inputMute unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}`)

			state.removeChannel(feedback.id)
		},
	}

	feedbacks['inputLevel'] = {
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

			const { isNew } = state.addChannel(ChannelType.Input, inputId, feedback.id, 'inputLevel')
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.Input, inputId))
				tcpClient.queue(requestMuteInfo(ChannelType.Input, inputId))
			}

			let levelDec = state.getLevel(ChannelType.Input, inputId)
			log(`inputLevel callback -- ID: ${feedback.id}, input: ${inputId + 1}, level (dec): ${levelDec}, isNew: ${isNew}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			log(`inputLevel unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}`)

			state.removeChannel(feedback.id)
		},
	}

	feedbacks['zoneMute'] = {
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

			state.addChannel(ChannelType.Zone, zoneId, feedback.id, 'zoneMute')

			let muteState = state.getMute(ChannelType.Zone, zoneId)
			log(`zoneMute callback -- ID: ${feedback.id}, zone: ${zoneId + 1}, state: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			log(`zoneMute unsubscribe -- ID: ${feedback.id}, zone: ${zoneId + 1}`)

			state.removeChannel(feedback.id)
		},
	}

	feedbacks['zoneLevel'] = {
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

			const { isNew } = state.addChannel(ChannelType.Zone, zoneId, feedback.id, 'zoneLevel')
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, zoneId))
				tcpClient.queue(requestMuteInfo(ChannelType.Zone, zoneId))
			}

			let levelDec = state.getLevel(ChannelType.Zone, zoneId)
			log(`zoneLevel callback -- ID: ${feedback.id}, zone: ${zoneId + 1}, level (dec): ${levelDec}, isNew: ${isNew}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			log(`zoneLevel unsubscribe -- ID: ${feedback.id}, zone: ${zoneId + 1}`)

			state.removeChannel(feedback.id)
		},
	}

	feedbacks['cgMute'] = {
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

			state.addChannel(ChannelType.ControlGroup, controlGroupId, feedback.id, 'cgMute')

			let muteState = state.getMute(ChannelType.ControlGroup, controlGroupId)
			log(`cgMute callback -- ID: ${feedback.id}, control group: ${controlGroupId + 1}, state: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			log(`cgMute unsubscribe -- ID: ${feedback.id}, control group: ${controlGroupId + 1}`)

			state.removeChannel(feedback.id)
		},
	}

	feedbacks['cgLevel'] = {
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

			const { isNew } = state.addChannel(ChannelType.ControlGroup, controlGroupId, feedback.id, 'cgLevel')
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, controlGroupId))
				tcpClient.queue(requestMuteInfo(ChannelType.ControlGroup, controlGroupId))
			}

			let levelDec = state.getLevel(ChannelType.ControlGroup, controlGroupId)
			log(`cgLevel callback -- ID: ${feedback.id}, CG: ${controlGroupId + 1}, level: ${levelDec}, new: ${isNew}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			log(`cgLevel unsubscribe -- ID: ${feedback.id}, control group: ${controlGroupId + 1}`)

			state.removeChannel(feedback.id)
		},
	}

	feedbacks['inputToZoneMute'] = {
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

			state.addSend(ChannelType.Input, inputId, zoneId, feedback.id, 'inputToZoneMute')

			let muteState = state.getSendMute(ChannelType.Input, inputId, zoneId)
			log(`inputToZoneMute callback -- ID: ${feedback.id}, input: ${inputId + 1}, zone: ${zoneId + 1}, mute: ${muteState}`)

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			log(`inputToZoneMute unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}, zone: ${zoneId + 1}`)

			state.removeSend(feedback.id)
		},
	}

	feedbacks['inputToZoneLevel'] = {
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

			const { isNew } = state.addSend(ChannelType.Input, inputId, zoneId, feedback.id, 'inputToZoneLevel')
			if (isNew) {
				log(`New send -- ID: ${feedback.id}, input ID: ${inputId}, zone ID: ${zoneId}`)
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.LEVEL, inputId, zoneId))
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputId, zoneId))
			}

			let levelDec = state.getSendLevel(ChannelType.Input, inputId, zoneId)
			log(`inputToZoneLevel callback -- ID: ${feedback.id}, input ID: ${inputId}, zone ID: ${zoneId}, level: ${levelDec}`)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			log(`inputToZoneLevel unsubscribe -- ID: ${feedback.id}, input: ${inputId + 1}, zone: ${zoneId + 1}`)

			state.removeSend(feedback.id)
		},
	}

	feedbacks['currentPreset'] = {
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
			log(`currentPreset callback -- ID: ${feedback.id}, current: ${currentPreset}, feedback: ${feedback.options.preset}`)

			return currentPreset == feedback.options.preset
		},
	}

	return feedbacks
}
