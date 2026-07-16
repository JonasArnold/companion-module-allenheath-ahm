import { Colors, SendType, MonitoredFeedbackType, ChannelType, SendInfoType } from './utility/constants.js'
import { getDbuValue, getChoicesArrayWithIncrementingNumbers } from './utility/helpers.js'
import { requestSendInfo } from './formatMIDI/sends.js'
import { requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'
import { getContext } from './context.js'

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
		callback: (feedback, bank) => {
			let inputId = parseInt(feedback.options.input)

			state.addChannel(ChannelType.Input, inputId)

			let muteState = state.getMute(ChannelType.Input, inputId)
			console.log('Feedback: inputMute callback -- Input: ', inputId + 1, ', state: ', muteState)

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			console.log('Feedback: inputMute unsubscribe -- Input: ', inputId + 1)

			if (!state.isManuallyTracked(ChannelType.Input, inputId)) {
				state.removeChannel(ChannelType.Input, inputId)
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
			let inputId = parseInt(feedback.options.input)

			const { isNew } = state.addChannel(ChannelType.Input, inputId)
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.Input, inputId))
				tcpClient.queue(requestMuteInfo(ChannelType.Input, inputId))
			}

			let levelDec = state.getLevel(ChannelType.Input, inputId)
			console.log('Feedback: inputLevel callback -- Input: ', inputId + 1, ', level (dec): ', levelDec, ', isNew: ', isNew)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			console.log('Feedback: inputLevel unsubscribe -- Input: ', inputId + 1)

			if (!state.isManuallyTracked(ChannelType.Input, inputId)) {
				state.removeChannel(ChannelType.Input, inputId)
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
			let zoneId = parseInt(feedback.options.zone)

			state.addChannel(ChannelType.Zone, zoneId)

			let muteState = state.getMute(ChannelType.Zone, zoneId)
			console.log('Feedback: zoneMute callback -- Zone: ', zoneId + 1, ', state: ', muteState)

			return muteState
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			console.log('Feedback: zoneMute unsubscribe -- Zone: ', zoneId + 1)

			if (!state.isManuallyTracked(ChannelType.Zone, zoneId)) {
				state.removeChannel(ChannelType.Zone, zoneId)
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
			let zoneId = parseInt(feedback.options.zone)

			const { isNew } = state.addChannel(ChannelType.Zone, zoneId)
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, zoneId))
				tcpClient.queue(requestMuteInfo(ChannelType.Zone, zoneId))
			}

			let levelDec = state.getLevel(ChannelType.Zone, zoneId)
			console.log('Feedback: zoneLevel callback -- Zone: ', zoneId + 1, ', level (dec): ', levelDec, ', isNew: ', isNew)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let zoneId = parseInt(feedback.options.zone)
			console.log('Feedback: zoneLevel unsubscribe -- Zone: ', zoneId + 1)

			if (!state.isManuallyTracked(ChannelType.Zone, zoneId)) {
				state.removeChannel(ChannelType.Zone, zoneId)
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
			let controlGroupId = parseInt(feedback.options.cg)

			state.addChannel(ChannelType.ControlGroup, controlGroupId)

			let muteState = state.getMute(ChannelType.ControlGroup, controlGroupId)
			console.log('Feedback: cgMute callback -- Control Group: ', controlGroupId + 1, ', state: ', muteState)

			return muteState
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			console.log('Feedback: cgMute unsubscribe -- Control Group: ', controlGroupId + 1)
			
			if (!state.isManuallyTracked(ChannelType.ControlGroup, controlGroupId)) {
				state.removeChannel(ChannelType.ControlGroup, controlGroupId)
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
			let controlGroupId = parseInt(feedback.options.cg)

			const { isNew } = state.addChannel(ChannelType.ControlGroup, controlGroupId)
			if (isNew) {
				// If new, immediately request level info
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, controlGroupId))
				tcpClient.queue(requestMuteInfo(ChannelType.ControlGroup, controlGroupId))
			}

			let levelDec = state.getLevel(ChannelType.ControlGroup, controlGroupId)
			console.log('Feedback: cgLevel callback -- Control Group: ', controlGroupId + 1, ', level (dec): ', levelDec, ', isNew: ', isNew)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let controlGroupId = parseInt(feedback.options.cg)
			console.log('Feedback: cgLevel unsubscribe -- Control Group: ', controlGroupId + 1)

			if (!state.isManuallyTracked(ChannelType.ControlGroup, controlGroupId)) {
				state.removeChannel(ChannelType.ControlGroup, controlGroupId)
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
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)

			state.addSend(ChannelType.Input, inputId, zoneId)

			let muteState = state.getSendMute(ChannelType.Input, inputId, zoneId)
			console.log(
				'Feedback: inputToZoneMute callback -- Input: ',
				inputId + 1,
				', Zone: ',
				zoneId + 1,
				', state: ',
				muteState,
			)

			return muteState
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			console.log('Feedback: inputToZoneMute unsubscribe -- Input: ', inputId + 1, ', Zone: ', zoneId + 1)
			
			state.removeSend(ChannelType.Input, inputId, zoneId)
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
			
			const { isNew } = state.addSend(ChannelType.Input, inputId, zoneId)
			if (isNew) {
				console.log('isNew send - input:', inputId, 'zone:', zoneId)
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.LEVEL, inputId, zoneId))
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputId, zoneId))
			}

			let levelDec = state.getSendLevel(ChannelType.Input, inputId, zoneId)
			console.log(
				'inputToZoneLevel feedback - input:',
				inputId,
				'zone:',
				zoneId,
				'level:',
				levelDec,
			)

			return getDbuValue(levelDec)
		},
		unsubscribe: (feedback) => {
			let inputId = parseInt(feedback.options.input)
			let zoneId = parseInt(feedback.options.zone)
			console.log('Feedback: inputToZoneLevel unsubscribe -- Input: ', inputId + 1, ', Zone: ', zoneId + 1)

			state.removeSend(ChannelType.Input, inputId, zoneId)
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
			console.log('Feedback: currentPreset callback -- Current Preset: ', currentPreset, ', Feedback Preset: ', feedback.options.preset)

			return currentPreset == feedback.options.preset
		},
	}

	return feedbacks
}
