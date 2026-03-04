import { TCPHelper, InstanceStatus } from '@companion-module/base'
import * as Constants from '../constants.js'
import * as Helpers from '../helpers.js'
import { noConnectionConfig, type AHMConfig } from '../config.js'
import { getAHMModel, type AHMModelDefinition } from './models.js'
import { FeedbackId } from '../feedbacks.js'
import { MidiTokenizer } from '../midi/tokenize/tokenizer.js'
import { ChannelParser } from '../midi/parse/channel-parser.js'
import { parseMidi } from '../midi/parse/parse-midi.js'
import { asyncSleep } from '../utils/sleep.js'

const MIDI_PORT = 51325
const TIME_BETW_MULTIPLE_REQ_MS = 150

export interface MonitoredFeedbackInfo {
	id?: string
	type: number
	sendType?: number
	channel?: number
	sendChannel?: number
}

export class AHMMatrix {
	config: AHMConfig
	model: AHMModelDefinition
	currentScene: number | null
	monitoredFeedbacks: MonitoredFeedbackInfo[]

	inputsMute: number[]
	inputsToZonesMute: number[][]
	zonesMute: number[]
	controlgroupsMute: number[]

	#instance: any
	#midiSocket?: TCPHelper
	#tokenizer?: MidiTokenizer
	#midiParser?: ChannelParser

	constructor(instance: any) {
		this.#instance = instance
		this.config = noConnectionConfig()
		this.model = getAHMModel(this.config.ahm_type)
		this.currentScene = null
		this.monitoredFeedbacks = []

		this.inputsMute = []
		this.inputsToZonesMute = []
		this.zonesMute = []
		this.controlgroupsMute = []
		this.resetState()
	}

	updateConfig(config: AHMConfig): void {
		this.config = config
		this.model = getAHMModel(config.ahm_type)
		this.resetState()
	}

	resetState(): void {
		this.inputsMute = new Array(this.model.numberOfInputs).fill(0)
		this.inputsToZonesMute = []
		this.zonesMute = new Array(this.model.numberOfZones).fill(0)
		this.controlgroupsMute = new Array(this.model.numberOfControlGroups).fill(0)
	}

	start(): void {
		if (!this.config.host) {
			this.#stop(InstanceStatus.BadConfig, 'No matrix TCP/IP host specified')
			return
		}

		this.#stop(InstanceStatus.Connecting, 'Starting matrix connection...')

		this.#midiSocket = new TCPHelper(this.config.host, MIDI_PORT)
		this.#tokenizer = new MidiTokenizer(this.#midiSocket, (msg) => this.#instance.log('debug', msg))
		this.#midiParser = new ChannelParser((msg) => this.#instance.log('debug', msg))

		void parseMidi((msg) => this.#instance.log('debug', msg), this.#tokenizer, this.#midiParser).catch((err) => {
			const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)
			this.#instance.log('error', `MIDI parsing stopped: ${msg}`)
		})

		this.#midiParser.on('input_mute', (channel, muted) => {
			this.inputsMute[channel] = muted ? 1 : 0
			this.#instance.checkFeedbacks(FeedbackId.InputMute)
		})
		this.#midiParser.on('zone_mute', (channel, muted) => {
			this.zonesMute[channel] = muted ? 1 : 0
			this.#instance.checkFeedbacks(FeedbackId.ZoneMute)
		})
		this.#midiParser.on('controlgroup_mute', (channel, muted) => {
			this.controlgroupsMute[channel] = muted ? 1 : 0
			this.#instance.checkFeedbacks(FeedbackId.ControlGroupMute)
		})
		this.#midiParser.on('send_mute', (input, zone, muted) => {
			this.updateSendMuteState(Constants.SendType.InputToZone, input, zone, muted ? 1 : 0)
			this.#instance.checkFeedbacks(FeedbackId.InputToZoneMute)
		})
		this.#midiParser.on('level_changed', (channelType, channel, level) => {
			const levelValue = this.getDbuValue(level)
			if (channelType === Constants.ChannelType.Input) {
				this.setVariableValues({ [Helpers.getVarNameInputLevel(channel)]: levelValue })
			} else if (channelType === Constants.ChannelType.Zone) {
				this.setVariableValues({ [Helpers.getVarNameZoneLevel(channel)]: levelValue })
			} else if (channelType === Constants.ChannelType.ControlGroup) {
				this.setVariableValues({ [Helpers.getVarNameCGLevel(channel)]: levelValue })
			}
		})

		this.#midiSocket.on('status_change', (status) => {
			this.#instance.updateStatus(status)
		})
		this.#midiSocket.on('error', (err) => {
			this.#instance.log('error', `Error: ${err.message}`)
			this.#instance.updateStatus(InstanceStatus.ConnectionFailure)
		})
		this.#midiSocket.on('connect', () => {
			this.#instance.log('debug', `MIDI Connected to ${this.config.host}`)
			this.#instance.updateStatus(InstanceStatus.Ok)
			void this.performStartupReadout()
		})
	}

	/**
	 * Stop operating the matrix, updating instance status to the given status.
	 */
	#stop(status: InstanceStatus, reason: string): void {
		this.#instance.updateStatus(status, reason)

		this.#instance.updateStatus
		if (this.#midiSocket) {
			this.#midiSocket.destroy()
			this.#midiSocket = undefined
		}
		this.#tokenizer = undefined
		this.#midiParser = undefined
	}

	/** Stop operating and disconnect from the matrix. */
	stop(reason: string): void {
		this.#stop(InstanceStatus.Disconnected, reason)
	}

	sendCommand(buffers: Buffer[]): void {
		if (buffers.length === 0 || !this.#midiSocket) return

		for (const buffer of buffers) {
			this.#instance.log('debug', `sending ${buffer.toString('hex')} via MIDI TCP @${this.config.host}`)
			this.#midiSocket.send(buffer)
		}
	}

	requestMuteInfo(chType: number, chNumber: number): void {
		if (!Helpers.checkIfValueOfEnum(chType, Constants.ChannelType)) return

		this.sendCommand([
			Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, chType, 0x01, 0x09, chNumber - 1, 0xf7]),
		])
	}

	requestSendMuteInfo(sendType: number, chNumber: number, sendChNumber: number): void {
		if (!Helpers.checkIfValueOfEnum(sendType, Constants.SendType)) return

		const chType = Helpers.getChTypeOfSendType(sendType)
		const sendChType = Helpers.getSendChTypeOfSendType(sendType)

		this.sendCommand([
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
		])
	}

	requestLevelInfo(chType: number, chNumber: number): void {
		if (!Helpers.checkIfValueOfEnum(chType, Constants.ChannelType)) return

		this.sendCommand([
			Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, chType, 0x01, 0x0b, 0x17, chNumber - 1, 0xf7]),
		])
	}

	updateSendMuteState(sendType: number, channelNumber: number, sendChannelNumber: number, muteState: number): void {
		if (!Helpers.checkIfValueOfEnum(sendType, Constants.SendType)) {
			return
		}

		switch (sendType) {
			case Constants.SendType.InputToZone:
				if (!Array.isArray(this.inputsToZonesMute[channelNumber])) {
					this.inputsToZonesMute[channelNumber] = new Array(this.model.numberOfZones + 1).fill(0)
				}

				if (typeof this.inputsToZonesMute[channelNumber][sendChannelNumber] === 'undefined') {
					this.#instance.log(
						'debug',
						`updateSendMuteState: Cannot access Mute Input ${channelNumber} to Zone ${sendChannelNumber}.`,
					)
				} else {
					this.inputsToZonesMute[channelNumber][sendChannelNumber] = muteState
				}
				break
			default:
				this.#instance.log('debug', `updateSendMuteState: Mute states are not implemented for send type ${sendType}`)
		}
	}

	setVariableValues(values: Record<string, string | number>): void {
		this.#instance.log('debug', `Updating variables: ${JSON.stringify(values)} `)
		this.#instance.setVariableValues(values)
	}

	async performStartupReadout(): Promise<void> {
		const fetchVariablesOnStartup = this.#instance.config.fetch_variables_on_startup
		await this.pollAllMonitoredFeedbacks()

		for (let index = 1; index <= this.model.numberOfInputs; index++) {
			this.requestMuteInfo(Constants.ChannelType.Input, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
			if (fetchVariablesOnStartup) {
				this.requestLevelInfo(Constants.ChannelType.Input, index)
				await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
			}
		}

		for (let index = 1; index <= this.model.numberOfZones; index++) {
			this.requestMuteInfo(Constants.ChannelType.Zone, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
			if (fetchVariablesOnStartup) {
				this.requestLevelInfo(Constants.ChannelType.Zone, index)
				await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
			}
		}

		for (let index = 1; index <= this.model.numberOfControlGroups; index++) {
			this.requestMuteInfo(Constants.ChannelType.ControlGroup, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
			if (fetchVariablesOnStartup) {
				this.requestLevelInfo(Constants.ChannelType.ControlGroup, index)
				await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
			}
		}
	}

	async pollAllMonitoredFeedbacks(): Promise<void> {
		for (const feedback of this.monitoredFeedbacks) {
			this.pollMonitoredFeedback(feedback)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	pollMonitoredFeedback(feedback: MonitoredFeedbackInfo): void {
		switch (feedback.type) {
			case Constants.MonitoredFeedbackType.MuteState:
				this.requestSendMuteInfo(feedback.sendType ?? 0, feedback.channel ?? 0, feedback.sendChannel ?? 0)
				break
			case Constants.MonitoredFeedbackType.Undefined:
				break
			default:
				this.#instance.log('debug', 'pollMonitoredFeedback: type of feedback not implemented')
		}
	}

	getDbuValue(dezValue: number): string | number {
		if (!Number.isInteger(dezValue) || dezValue > 127 || dezValue < 0) {
			return NaN
		}

		return Constants.dbu_Values[dezValue]
	}
}
