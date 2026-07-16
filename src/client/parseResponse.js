import { ChannelType } from '../utility/constants.js'
import { getVarNameInputLevel, getVarNameZoneLevel, getVarNameCGLevel, getDbuValue } from '../utility/helpers.js'
import { getContext } from '../context.js'

const LEVEL_HANDLERS = {
	0xb0: { type: ChannelType.Input, getVarName: getVarNameInputLevel, feedback: 'inputLevel', label: 'Input' },
	0xb1: { type: ChannelType.Zone, getVarName: getVarNameZoneLevel, feedback: 'zoneLevel', label: 'Zone' },
	0xb2: { type: ChannelType.ControlGroup, getVarName: getVarNameCGLevel, feedback: 'cgLevel', label: 'Control Group' },
}

const MUTE_HANDLERS = {
	0x90: { type: ChannelType.Input, feedback: 'inputMute', label: 'Input' },
	0x91: { type: ChannelType.Zone, feedback: 'zoneMute', label: 'Zone' },
	0x92: { type: ChannelType.ControlGroup, feedback: 'cgMute', label: 'Control Group' },
}

export function parseResponse(data) {
	const { companion, state, poller } = getContext()
	console.log('INCOMING RAW:', data.toString('hex'))

	if (data[0] === 0xf0) {
		// receiving SysEx data

		// Common data for all channel types:
		let inputId = parseInt(data[10])
		let zoneId = parseInt(data[12])

		if (data[9] === 0x02) {
			// receiving send level data
			let levelRaw = parseInt(data[13])

			companion.log(
				'info',
				`PARSED: Send level data -- Input ${inputId + 1} to Zone ${zoneId + 1} has new level: ${levelRaw} (dec) = ${getDbuValue(levelRaw)} (dBu)`,
			)

			state.setSend(ChannelType.Input, inputId, zoneId, levelRaw, undefined) // log below displays correct data, this line doesn't
			companion.checkFeedbacks('inputToZoneLevel')
			return
		}

		if (data[9] === 0x03) {
			// receiving send mute data
			let mute = data[13] === 127 ? true : data[13] === 63 ? false : undefined
			if (mute === undefined) return

			companion.log(
				'info',
				`PARSED: Send mute data -- Input ${inputId + 1} to Zone ${zoneId + 1} has new mute status: ${mute ? 'muted' : 'unmuted'}`,
			)

			state.setSend(ChannelType.Input, inputId, zoneId, undefined, mute)
			companion.checkFeedbacks('inputToZoneMute')
			return
		}
		return
	}

	if (data[1] === 0x63 && data[3] === 0x62) {
		// second value of hex:63 and fourth value of hex:62 means level data
		const handler = LEVEL_HANDLERS[data[0]]
		if (!handler) return

		// Data shared across all channel types:
		let channelId = parseInt(data[2])
		let level = parseInt(data[6])
		let variableName = handler.getVarName(channelId + 1) // +1 because the channelId is 0-indexed

		companion.log(
			'info',
			`PARSED: ${handler.label} ${channelId + 1} has new level: ${level} (dec) = ${getDbuValue(level)} (dBu), updating variable ${variableName}`,
		)

		state.setChannel(handler.type, channelId, level, undefined)
		companion.setVariableValues({ [variableName]: getDbuValue(level) })
		companion.checkFeedbacks(handler.feedback)
		return
	}

	if (data[0] in MUTE_HANDLERS) {
		// first value of hex:90, hex:91, or hex:92 means mute of some kind
		const handler = MUTE_HANDLERS[data[0]]
		let channelId = parseInt(data[1])
		let mute = data[2] === 127 ? true : data[2] === 63 ? false : undefined

		companion.log(
			'info',
			`PARSED: ${handler.label} ${channelId + 1} has new mute status: ${mute ? 'muted' : 'unmuted'}`,
		)

		if (!handler || mute === undefined) return

		state.setChannel(handler.type, channelId, undefined, mute)
		companion.checkFeedbacks(handler.feedback)
		return
	}

	if (data[0] === 0xb0 && data[3] === 0xc0) {
		// first value of hex:B0 and third value of hex:C0 means preset recall data
		let presetId = Number(data[4])
		let presetIdOffset = Number(data[2])
		let preset = presetId + presetIdOffset * 128 + 1

		state.setPreset(preset)
		poller.poll()

		companion.log(
			'info',
			`PARSED: Preset was recalled: ${state.getPreset()}`,
		)

		companion.setVariableValues({ currentPreset: state.getPreset() })
		companion.checkFeedbacks('currentPreset')
		return
	}
}
