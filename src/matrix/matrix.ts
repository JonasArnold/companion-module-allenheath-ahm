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
import { prettyBytes } from '../utils/pretty.js'

const AHM_MIDI_PORT = 51325
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
	controlGroupsMute: number[]

	#instance: any
	#socket?: TCPHelper

	constructor(instance: any) {
		this.#instance = instance
		this.config = noConnectionConfig()
		this.model = getAHMModel(this.config.ahm_type)
		this.currentScene = null
		this.monitoredFeedbacks = []

		this.inputsMute = []
		this.inputsToZonesMute = []
		this.zonesMute = []
		this.controlGroupsMute = []
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
		this.controlGroupsMute = new Array(this.model.numberOfControlGroups).fill(0)
	}

	/**
	 * Stop operating the matrix, updating instance status to the given status.
	 */
	#stop(status: InstanceStatus, reason: string): void {
		this.#instance.updateStatus(status, reason)

		this.#instance.updateStatus
		if (this.#socket) {
			this.#socket.destroy()
			this.#socket = undefined
		}
	}

	/** Stop operating and disconnect from the matrix. */
	stop(reason: string): void {
		this.#stop(InstanceStatus.Disconnected, reason)
	}

	start(): void {
		if (!this.config.host) {
			this.#stop(InstanceStatus.BadConfig, 'No matrix TCP/IP host specified')
			return
		}

		this.#stop(InstanceStatus.Connecting, 'Starting matrix connection...')

		// create socket
		const socket = new TCPHelper(this.config.host, AHM_MIDI_PORT)
		this.#socket = socket

		const instance = this.#instance		
		const fetchVariablesOnStartup = instance.config.fetch_variables_on_startup

		// Socket error handling
		socket.on('error', (err) => {
			const errStr = `Error: ${err}`
			instance.log('error', errStr)
			this.#stop(InstanceStatus.ConnectionFailure, errStr)
		})

		// Start processing replies
		this.#processMatrixReplies(socket).then(
			() => {
				const processingComplete = 'Matrix reply processing complete, disconnecting'
				instance.log('info', processingComplete)
				this.stop(processingComplete)
			},
			(reason: any) => {
				const err = `Error processing replies: ${reason}`
				instance.log('error', err)
				this.#stop(InstanceStatus.ConnectionFailure, err)
			},
		)

		// initial actions on connect (processing replies is running)
		socket.once('connect', () => {
			instance.log('info', `Connected to ${this.config.host}:${AHM_MIDI_PORT}`)
			instance.updateStatus(InstanceStatus.Ok)

			void (async () => {
				// retrieve current state for feedbacks first
				await this.#retrieveFeedbackStates()

				// optionally fetch current state for variables afterwards
				if (fetchVariablesOnStartup) {
					await this.#retrieveVariableStates()
				}
			})().catch((err: unknown) => {
				const errStr = `Error during startup readout: ${String(err)}`
				instance.log('error', errStr)
			})
		})
	}

	/** Read and process mixer reply messages from `socket`. */
	async #processMatrixReplies(socket: TCPHelper) {
		const instance = this.#instance

		const verboseLog = (msg: string) => {
			// wrapped, so that logging can be controlled from here
			instance.log('debug', msg)
		}

		const tokenizer = new MidiTokenizer(socket, verboseLog)
		const mixerChannelParser = new ChannelParser(verboseLog)

		mixerChannelParser.on('input_mute', (channel, muted) => {
			this.inputsMute[channel] = muted ? 1 : 0
			this.#instance.checkFeedbacks(FeedbackId.InputMute)
		})
		mixerChannelParser.on('zone_mute', (channel, muted) => {
			this.zonesMute[channel] = muted ? 1 : 0
			this.#instance.checkFeedbacks(FeedbackId.ZoneMute)
		})
		mixerChannelParser.on('controlgroup_mute', (channel, muted) => {
			this.controlGroupsMute[channel] = muted ? 1 : 0
			this.#instance.checkFeedbacks(FeedbackId.ControlGroupMute)
		})
		mixerChannelParser.on('send_mute', (input, zone, muted) => {
			this.updateSendMuteState(Constants.SendType.InputToZone, input, zone, muted ? 1 : 0)
			this.#instance.checkFeedbacks(FeedbackId.InputToZoneMute)
		})
		mixerChannelParser.on('level_changed', (channelType, channel, level) => {
			const levelValue = this.getDbuValue(level)
			if (channelType === Constants.ChannelType.Input) {
				this.setVariableValues({ [Helpers.getVarNameInputLevel(channel)]: levelValue })
			} else if (channelType === Constants.ChannelType.Zone) {
				this.setVariableValues({ [Helpers.getVarNameZoneLevel(channel)]: levelValue })
			} else if (channelType === Constants.ChannelType.ControlGroup) {
				this.setVariableValues({ [Helpers.getVarNameCGLevel(channel)]: levelValue })
			}
		})

		return parseMidi(verboseLog, tokenizer, mixerChannelParser)
	}

	async #retrieveFeedbackStates() {
		await this.pollAllMonitoredFeedbacks()

		for (let index = 1; index <= this.model.numberOfInputs; index++) {
			this.requestMuteInfo(Constants.ChannelType.Input, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
		}

		for (let index = 1; index <= this.model.numberOfZones; index++) {
			this.requestMuteInfo(Constants.ChannelType.Zone, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
		}

		for (let index = 1; index <= this.model.numberOfControlGroups; index++) {
			this.requestMuteInfo(Constants.ChannelType.ControlGroup, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	async #retrieveVariableStates() {
		for (let index = 1; index <= this.model.numberOfInputs; index++) {
			this.requestLevelInfo(Constants.ChannelType.Input, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
		}

		for (let index = 1; index <= this.model.numberOfZones; index++) {
			this.requestLevelInfo(Constants.ChannelType.Zone, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
		}

		for (let index = 1; index <= this.model.numberOfControlGroups; index++) {
			this.requestLevelInfo(Constants.ChannelType.ControlGroup, index)
			await asyncSleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	sendCommand(buffers: Buffer[]): void {
		if (buffers.length === 0 || !this.#socket) return

		for (const buffer of buffers) {
			this.#instance.log('debug', `SEND to ${this.config.host}: ${prettyBytes(Array.from(buffer))}`)
			this.#socket.send(buffer)
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
