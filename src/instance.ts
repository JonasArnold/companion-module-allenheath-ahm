// @ts-nocheck
import { InstanceBase, InstanceStatus, TCPHelper } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import { FeedbackId } from './feedbacks.js'
import * as Constants from './constants.js'
import * as Helpers from './helpers.js'
import { MidiTokenizer } from './midi/tokenize/tokenizer.js'
import { ChannelParser } from './midi/parse/channel-parser.js'
import { parseMidi } from './midi/parse/parse-midi.js'
import { getConfigFields as getModuleConfigFields, normalizeConfig, type AHMConfig } from './config.js'
import { getAHMModel } from './models.js'

const MIDI_PORT = 51325
const TIME_BETW_MULTIPLE_REQ_MS = 150

export class AHMInstance extends InstanceBase<AHMConfig> {
	constructor(internal) {
		super(internal)
		this.midiSocket = undefined
		this.tokenizer = undefined
		this.midiParser = undefined
		this.model = getAHMModel('ahm64')

		this.inputsMute = []
		this.inputsToZonesMute = []
		this.zonesMute = []
		this.controlgroupsMute = []
		this.monitoredFeedbacks = []
	}

	async init(config) {
		this.config = normalizeConfig(config)

		this.updateStatus(InstanceStatus.Connecting)

		this.applyModelFromConfig()

		this.inputsMute = this.createArray(this.model.numberOfInputs)
		this.inputsToZonesMute = []
		this.zonesMute = this.createArray(this.model.numberOfZones)
		this.controlgroupsMute = this.createArray(this.model.numberOfControlGroups)
		this.monitoredFeedbacks = []

		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
		this.initTCP()
	}

	async destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}
		this.log('debug', 'destroy')
	}

	applyModelFromConfig() {
		this.model = getAHMModel(this.config.ahm_type)
		this.log('info', `Set Unit Type to ${this.model.label}.`)
	}

	async configUpdated(config) {
		this.config = normalizeConfig(config)
		this.applyModelFromConfig()
		this.initActions()
		this.initVariables()
		this.initTCP()
	}

	getConfigFields() {
		return getModuleConfigFields()
	}

	initVariables() {
		const [definitions, initValues] = getVariables.bind(this)()
		this.setVariableDefinitions(definitions)
		this.setVariableValues(initValues)
	}

	initFeedbacks() {
		const feedbacks = getFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	initPresets() {
		const presets = getPresets.bind(this)()
		this.setPresetDefinitions(presets)
	}

	initActions() {
		const actions = getActions.bind(this)()
		this.setActionDefinitions(actions)
	}

	async pollAllMonitoredFeedbacks() {
		for (const feedback of this.monitoredFeedbacks) {
			await this.pollMonitoredFeedback(feedback)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	async pollMonitoredFeedback(feedback) {
		switch (feedback.type) {
			case Constants.MonitoredFeedbackType.MuteState:
				this.requestSendMuteInfo(feedback.sendType ?? 0, feedback.channel ?? 0, feedback.sendChannel ?? 0)
				break
			case Constants.MonitoredFeedbackType.Undefined:
				break
			default:
				this.log('debug', 'pollMonitoredFeedback: type of feedback not implemented')
		}
	}

	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async performReadoutAfterConnected() {
		const fetchVariablesOnStartup = this.config.fetch_variables_on_startup
		await this.pollAllMonitoredFeedbacks()

		for (let index = 1; index <= this.model.numberOfInputs; index++) {
			this.requestMuteInfo(Constants.ChannelType.Input, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			if (fetchVariablesOnStartup) {
				this.requestLevelInfo(Constants.ChannelType.Input, index)
				await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			}
		}

		for (let index = 1; index <= this.model.numberOfZones; index++) {
			this.requestMuteInfo(Constants.ChannelType.Zone, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			if (fetchVariablesOnStartup) {
				this.requestLevelInfo(Constants.ChannelType.Zone, index)
				await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			}
		}

		for (let index = 1; index <= this.model.numberOfControlGroups; index++) {
			this.requestMuteInfo(Constants.ChannelType.ControlGroup, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			if (fetchVariablesOnStartup) {
				this.requestLevelInfo(Constants.ChannelType.ControlGroup, index)
				await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			}
		}
	}

	requestMuteInfo(chType, chNumber) {
		if (!Helpers.checkIfValueOfEnum(chType, Constants.ChannelType)) return

		const buffer = [
			Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, chType, 0x01, 0x09, chNumber - 1, 0xf7]),
		]
		this.sendCommand(buffer)
	}

	requestSendMuteInfo(sendType, chNumber, sendChNumber) {
		if (!Helpers.checkIfValueOfEnum(sendType, Constants.SendType)) return

		const chType = Helpers.getChTypeOfSendType(sendType)
		const sendChType = Helpers.getSendChTypeOfSendType(sendType)
		const buffer = [
			Buffer.from([
				0xf0,
				0x00,
				0x00,
				0x1a,
				0x50,
				0x12,
				0x01,
				0x00,
				chType,
				0x01,
				0x0f,
				0x03,
				chNumber - 1,
				sendChType,
				sendChNumber - 1,
				0xf7,
			]),
		]
		this.sendCommand(buffer)
	}

	requestLevelInfo(chType, chNumber) {
		if (!Helpers.checkIfValueOfEnum(chType, Constants.ChannelType)) return

		const buffer = [
			Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, chType, 0x01, 0x0b, 0x17, chNumber - 1, 0xf7]),
		]
		this.sendCommand(buffer)
	}

	createArray(size) {
		return new Array(size).fill(0)
	}

	setVariableValues(values) {
		this.log('debug', `Updating variables: ${JSON.stringify(values)} `)
		super.setVariableValues(values)
	}

	getDbuValue(dezValue) {
		if (!Number.isInteger(dezValue) || dezValue > 127 || dezValue < 0) {
			return NaN
		}

		return Constants.dbu_Values[dezValue]
	}

	sendCommand(buffers) {
		if (buffers.length === 0) return

		for (const buffer of buffers) {
			if (this.midiSocket !== undefined) {
				this.log('debug', `sending ${buffer.toString('hex')} via MIDI TCP @${this.config.host}`)
				this.midiSocket.send(buffer)
			}
		}
	}

	initTCP() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
			delete this.midiSocket
		}

		if (!this.config.host) return

		this.midiSocket = new TCPHelper(this.config.host, MIDI_PORT)
		this.tokenizer = new MidiTokenizer(this.midiSocket, (msg) => this.log('debug', msg))
		this.midiParser = new ChannelParser((msg) => this.log('debug', msg))

		void parseMidi((msg) => this.log('debug', msg), this.tokenizer, this.midiParser).catch((err) => {
			this.log('error', `MIDI parsing stopped: ${err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)}`)
		})

		this.midiParser.on('input_mute', (channel, muted) => {
			this.log('debug', `[INSTANCE] input_mute channel=${channel + 1} muted=${muted}`)
			this.inputsMute[channel] = muted ? 1 : 0
			this.checkFeedbacks(FeedbackId.InputMute)
		})
		this.midiParser.on('zone_mute', (channel, muted) => {
			this.log('debug', `[INSTANCE] zone_mute channel=${channel + 1} muted=${muted}`)
			this.zonesMute[channel] = muted ? 1 : 0
			this.checkFeedbacks(FeedbackId.ZoneMute)
		})
		this.midiParser.on('controlgroup_mute', (channel, muted) => {
			this.log('debug', `[INSTANCE] controlgroup_mute channel=${channel + 1} muted=${muted}`)
			this.controlgroupsMute[channel] = muted ? 1 : 0
			this.checkFeedbacks(FeedbackId.ControlGroupMute)
		})
		this.midiParser.on('send_mute', (input, zone, muted) => {
			this.log('debug', `[INSTANCE] send_mute input=${input} zone=${zone} muted=${muted}`)
			this.updateSendMuteState(Constants.SendType.InputToZone, input, zone, muted ? 1 : 0)
			this.checkFeedbacks(FeedbackId.InputToZoneMute)
		})
		this.midiParser.on('level_changed', (channelType, channel, level) => {
			const levelValue = this.getDbuValue(level)
			if (channelType === Constants.ChannelType.Input) {
				const variableName = Helpers.getVarNameInputLevel(channel)
				this.setVariableValues({ [variableName]: levelValue })
			} else if (channelType === Constants.ChannelType.Zone) {
				const variableName = Helpers.getVarNameZoneLevel(channel)
				this.setVariableValues({ [variableName]: levelValue })
			} else if (channelType === Constants.ChannelType.ControlGroup) {
				const variableName = Helpers.getVarNameCGLevel(channel)
				this.setVariableValues({ [variableName]: levelValue })
			}
		})

		this.midiSocket.on('status_change', (status) => {
			this.updateStatus(status)
		})

		this.midiSocket.on('error', (err) => {
			this.log('error', `Error: ${err.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
		})

		this.midiSocket.on('connect', () => {
			this.log('debug', `MIDI Connected to ${this.config.host}`)
			this.updateStatus(InstanceStatus.Ok)

			void this.performReadoutAfterConnected()
		})
	}

	updateSendMuteState(sendType, channelNumber, sendChannelNumber, muteState) {
		if (!Helpers.checkIfValueOfEnum(sendType, Constants.SendType)) {
			return
		}

		switch (sendType) {
			case Constants.SendType.InputToZone:
				if (!Array.isArray(this.inputsToZonesMute[channelNumber])) {
					this.inputsToZonesMute[channelNumber] = new Array(this.model.numberOfZones + 1).fill(0)
				}

				if (typeof this.inputsToZonesMute[channelNumber][sendChannelNumber] === 'undefined') {
					this.log(
						'debug',
						`updateSendMuteState: Cannot access Mute Input ${channelNumber} to Zone ${sendChannelNumber}.`,
					)
				} else {
					this.inputsToZonesMute[channelNumber][sendChannelNumber] = muteState
				}
				break
			default:
				this.log('debug', `updateSendMuteState: Mute states are not implemented for send type ${sendType}`)
		}
	}
}
