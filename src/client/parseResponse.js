import { ChannelType } from '../utility/constants.js'
import { getVarNameInputLevel, getVarNameZoneLevel, getVarNameCGLevel, getDbuValue } from '../utility/helpers.js'
import { getContext } from '../context.js'
import { FeedbackId } from '../feedbacks.js'
import { createLogger } from '../utility/log.js'

const log = createLogger('ParseResponse')

const LEVEL_HANDLERS = {
	0xb0: { type: ChannelType.Input, getVarName: getVarNameInputLevel, feedback: FeedbackId.InputLevel, label: 'Input' },
	0xb1: { type: ChannelType.Zone, getVarName: getVarNameZoneLevel, feedback: FeedbackId.ZoneLevel, label: 'Zone' },
	0xb2: {
		type: ChannelType.ControlGroup,
		getVarName: getVarNameCGLevel,
		feedback: FeedbackId.ControlGroupLevel,
		label: 'Control Group',
	},
}

const MUTE_HANDLERS = {
	0x90: { type: ChannelType.Input, feedback: FeedbackId.InputMute, label: 'Input' },
	0x91: { type: ChannelType.Zone, feedback: FeedbackId.ZoneMute, label: 'Zone' },
	0x92: { type: ChannelType.ControlGroup, feedback: FeedbackId.ControlGroupMute, label: 'Control Group' },
}

export function parseResponse(data) {
	const { companion, state, poller } = getContext()

	if (data[0] === 0xf0) {
		// receiving SysEx data

		// Common data for all channel types:
		let inputId = parseInt(data[10])
		let zoneId = parseInt(data[12])

		if (data[9] === 0x02) {
			// receiving send level data
			let levelRaw = parseInt(data[13])
			let levelDbu = getDbuValue(levelRaw)
			log.debug('InputToZoneLevel', { inputId, zoneId, levelRaw, levelDbu }, data)

			state.setSend(ChannelType.Input, inputId, zoneId, levelRaw, undefined)
			companion.checkFeedbacks(FeedbackId.InputToZoneLevel)
			return
		}

		if (data[9] === 0x03) {
			// receiving send mute data
			let mute = data[13] === 127 ? true : data[13] === 63 ? false : undefined
			if (mute === undefined) {
				log.warn('UnparsedResponse', { reason: 'InvalidSendMuteValue' }, data)
				return
			}
			log.debug('InputToZoneMute', { inputId, zoneId, mute }, data)

			state.setSend(ChannelType.Input, inputId, zoneId, undefined, mute)
			companion.checkFeedbacks(FeedbackId.InputToZoneMute)
			return
		}
		log.warn('UnparsedResponse', { reason: 'UnknownSysExResponse' }, data)
		return
	}

	if (data[1] === 0x63 && data[3] === 0x62) {
		// second value of hex:63 and fourth value of hex:62 means level data
		const handler = LEVEL_HANDLERS[data[0]]
		if (!handler) {
			log.warn('UnparsedResponse', { reason: 'UnknownChannelLevelType' }, data)
			return
		}

		// Data shared across all channel types:
		let channelId = parseInt(data[2])
		let level = parseInt(data[6])
		let levelDbu = getDbuValue(level)
		let variableName = handler.getVarName(channelId + 1) // +1 because the channelId is 0-indexed
		log.debug(
			'ChannelLevel',
			{ channelType: handler.label.replaceAll(' ', ''), channelId, level, levelDbu, variableName },
			data,
		)

		state.setChannel(handler.type, channelId, level, undefined)
		companion.setVariableValues({ [variableName]: levelDbu })
		companion.checkFeedbacks(handler.feedback)
		return
	}

	if (data[0] in MUTE_HANDLERS) {
		// first value of hex:90, hex:91, or hex:92 means mute of some kind
		const handler = MUTE_HANDLERS[data[0]]
		let channelId = parseInt(data[1])
		let mute = data[2] === 127 ? true : data[2] === 63 ? false : undefined

		if (!handler || mute === undefined) {
			log.warn('UnparsedResponse', { reason: 'InvalidChannelMuteValue' }, data)
			return
		}
		log.debug('ChannelMute', { channelType: handler.label.replaceAll(' ', ''), channelId, mute }, data)

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
		// run poller, to request new levels and mutes after preset recall
		poller.poll()

		log.debug('PresetRecall', { presetId, presetIdOffset, preset }, data)
		log.info('Preset was recalled', { preset })

		companion.setVariableValues({ currentPreset: state.getPreset() })
		companion.checkFeedbacks(FeedbackId.CurrentPreset)
		return
	}

	log.warn('UnparsedResponse', { reason: 'UnknownResponse' }, data)
}
