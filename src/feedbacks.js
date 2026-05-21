import { Colors, SendType, MonitoredFeedbackType, ChannelType, SendInfoType } from './utility/constants.js'
import { getDbuValue, getChoicesArrayWithIncrementingNumbers } from './utility/helpers.js'
import { requestSendInfo } from './formatMIDI/sends.js'
import { requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'

export function getFeedbacks(state, tcpClient, numberOfIO) {
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
		callback: (feedback, bank) => {
			let input = parseInt(feedback.options.input)
			console.log('feedback log', input, feedback.options.input)

			state.addChannel(ChannelType.Input, input)

			let value = state.getMute(ChannelType.Input, input)
			console.log('feedback eval:', input, value)
			return value
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			if (!state.isManuallyTracked(ChannelType.Input, input)) {
				state.removeChannel(ChannelType.Input, input)
			}
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
			let input = parseInt(feedback.options.input)
			console.log('feedback log', input, feedback.options.input)

			const { isNew } = state.addChannel(ChannelType.Input, input)
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.Input, input))
				tcpClient.queue(requestMuteInfo(ChannelType.Input, input))
			}

			console.log('feedback getLevel ', state.getLevel(ChannelType.Input, input))
			return getDbuValue(state.getLevel(ChannelType.Input, input))
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			if (!state.isManuallyTracked(ChannelType.Input, input)) {
				state.removeChannel(ChannelType.Input, input)
			}
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
			let zone = parseInt(feedback.options.zone)
			console.log('zoneMute feedback reading - zone:', zone, 'result:', state.getMute(ChannelType.Zone, zone))
			state.addChannel(ChannelType.Zone, zone)

			return state.getMute(ChannelType.Zone, zone)
		},
		unsubscribe: (feedback) => {
			let zone = parseInt(feedback.options.zone)
			if (!state.isManuallyTracked(ChannelType.Zone, zone)) {
				state.removeChannel(ChannelType.Zone, zone)
			}
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
			let zone = parseInt(feedback.options.zone)
			console.log('feedback log', zone, feedback.options.zone)

			const { isNew } = state.addChannel(ChannelType.Zone, zone)
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, zone))
				tcpClient.queue(requestMuteInfo(ChannelType.Zone, zone))
			}

			console.log('feedback getLevel ', state.getLevel(ChannelType.Zone, zone))
			return getDbuValue(state.getLevel(ChannelType.Zone, zone))
		},
		unsubscribe: (feedback) => {
			let zone = parseInt(feedback.options.zone)
			if (!state.isManuallyTracked(ChannelType.Zone, zone)) {
				state.removeChannel(ChannelType.Zone, zone)
			}
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
			let cg = parseInt(feedback.options.cg)

			state.addChannel(ChannelType.ControlGroup, cg)

			return state.getMute(ChannelType.ControlGroup, cg)
		},
		unsubscribe: (feedback) => {
			let cg = parseInt(feedback.options.cg)
			if (!state.isManuallyTracked(ChannelType.ControlGroup, cg)) {
				state.removeChannel(ChannelType.ControlGroup, cg)
			}
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
			let cg = parseInt(feedback.options.cg)
			console.log('feedback log', cg, feedback.options.cg)

			const { isNew } = state.addChannel(ChannelType.ControlGroup, cg)
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, cg))
				tcpClient.queue(requestMuteInfo(ChannelType.ControlGroup, cg))
			}

			console.log('feedback getLevel ', state.getLevel(ChannelType.ControlGroup, cg))
			return getDbuValue(state.getLevel(ChannelType.ControlGroup, cg))
		},
		unsubscribe: (feedback) => {
			let cg = parseInt(feedback.options.cg)
			if (!state.isManuallyTracked(ChannelType.ControlGroup, cg)) {
				state.removeChannel(ChannelType.ControlGroup, cg)
			}
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
			let input = parseInt(feedback.options.input)
			let zone = parseInt(feedback.options.zone)

			state.addSend(ChannelType.Input, input, zone)

			return state.getSendMute(ChannelType.Input, input, zone)
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			let zone = parseInt(feedback.options.zone)
			state.removeSend(ChannelType.Input, input, zone)
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
			let input = parseInt(feedback.options.input)
			let zone = parseInt(feedback.options.zone)
			console.log(
				'inputToZoneLevel feedback - input:',
				input,
				'zone:',
				zone,
				'level:',
				state.getSendLevel(ChannelType.Input, input, zone),
			)

			const { isNew } = state.addSend(ChannelType.Input, input, zone)
			if (isNew) {
				console.log('isNew send - input:', input, 'zone:', zone)
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.LEVEL, input, zone))
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, input, zone))
			}

			return getDbuValue(state.getSendLevel(ChannelType.Input, input, zone))
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			let zone = parseInt(feedback.options.zone)
			state.removeSend(ChannelType.Input, input, zone)
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
			return currentPreset == feedback.options.preset
		},
	}

	return feedbacks
}
