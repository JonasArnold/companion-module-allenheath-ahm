import { ChannelType } from '../utility/constants.js'
import { getVarNameInputLevel, getVarNameZoneLevel, getVarNameCGLevel, getDbuValue } from '../utility/helpers.js'

const LEVEL_HANDLERS = {
	0xb0: { type: ChannelType.Input, getVarName: getVarNameInputLevel, feedback: 'inputLevel', label: 'Input' },
	0xb0: { type: ChannelType.Zone, getVarName: getVarNameZoneLevel, feedback: 'zoneLevel', label: 'Zone' },
	0xb0: { type: ChannelType.ControlGroup, getVarName: getVarNameCGLevel, feedback: 'cgLevel', label: 'Control Group' },
}

const MUTE_HANDLERS = {
	0x90: { type: ChannelType.Input, feedback: 'inputMute' },
	0x91: { type: ChannelType.Zone, feedback: 'zoneMute' },
	0x92: { type: ChannelType.ControlGroup, feedback: 'cgMute' },
}

export function parseResponse(data, { companion }, state, poller) {
	console.log('INCOMING RAW:', data.toString('hex'))

	if (data[0] === 0xf0) {
		// receiving SysEx data

		// Common data for all channel types:
		let inputNum = parseInt(data[10])
		let zoneNum = parseInt(data[12])

		if (data[9] === 0x02) {
			// receiving send level data
			let level = parseInt(data[13])

			state.setSend(ChannelType.Input, inputNum, zoneNum, level, undefined) // log below displays correct data, this line doesn't
			companion.log(
				'info',
				`RECIEVED: send level data -- Input ${inputNum} to Zone ${zoneNum} at ${getDbuValue(level)}`,
			)
			companion.checkFeedbacks('inputToZoneLevel')
			return
		}

		if (data[9] === 0x03) {
			// receiving send mute data
			let mute = data[13] === 127 ? true : data[13] === 63 ? false : undefined
			if (mute === undefined) return

			state.setSend(ChannelType.Input, inputNum, zoneNum, undefined, mute)
			companion.log(
				'info',
				`RECIEVED: send mute data -- Input ${inputNum} to Zone ${zoneNum} is ${mute ? 'muted' : 'unmuted'}`,
			)
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
		let channel = parseInt(data[2])
		let level = parseInt(data[6])
		let variableName = handler.getVarName(channel)

		companion.log(
			'info',
			`${handler.label} ${channel} has new level: ${level} (dec) = ${getDbuValue(level)} (dBu), changing variable ${variableName}`,
		)
		state.setChannel(handler.type, channel, level, undefined)
		companion.setVariableValues({ [variableName]: getDbuValue(level) })
		companion.checkFeedbacks(handler.feedback)
		return
	}

	if (data[0] === 0x90 || data[0] === 0x91 || data[0] === 0x92) {
		// first value of hex:90, hex:91, or hex:92 means mute of some kind
		const handler = MUTE_HANDLERS[data[0]]
		let channel = parseInt(data[1])
		let mute = data[2] === 127 ? true : data[2] === 63 ? false : undefined
		console.log('INCOMING MUTE DATA:', data[0], channel, mute)

		if (!handler || mute === undefined) return

		state.setChannel(handler.type, channel, undefined, mute)
		companion.checkFeedbacks(handler.feedback)
		return
	}

	if (data[0] === 0xb0 && data[3] === 0xc0) {
		// first value of hex:B0 and third value of hex:C0 means preset recall data

		let presetNum = Number(data[4])
		let presetNumOffset = Number(data[2])
		let preset = presetNum + presetNumOffset * 128 + 1
		state.setPreset(preset)
		poller.poll()

		companion.log('info', `Preset ${state.getPreset()} recalled`)
		companion.setVariableValues({ currentPreset: state.getPreset() })
		companion.checkFeedbacks('currentPreset')
		return
	}
}
