import { InstanceBase, InstanceStatus } from '@companion-module/base'
import { getActions } from './src/actions.js'
import { getPresets } from './src/presets.js'
import { getVariables } from './src/variables.js'
import { getFeedbacks } from './src/feedbacks.js'
import upgradeScripts from './src/upgrades.js'
import { ChannelType } from './src/utility/constants.js'
import { configFields } from './src/config.js'
import { trackAHMParams } from './src/state/AHMState.js'
import { TCPClient } from './src/client/TCP.js'
import { pollStateTimer } from './src/client/pollState.js'
import { initContext } from './src/context.js'
import { createLogger } from './src/utility/log.js'

const MIDI_PORT = 51325
const log = createLogger('Instance')

export default class AHMInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.pollStartTimeout = null

		this.updateStatus(InstanceStatus.Connecting)

		this.AHMState = trackAHMParams()
		this.tcpClient = TCPClient()

		this.configureRuntime()

		// Polling callback hooks
		this.tcpClient.onConnected(() => {
			this.clearPollStartTimeout()
			this.pollStartTimeout = setTimeout(() => {
				this.pollStartTimeout = null
				this.pollState.start()
			}, 2000) // Waits 2 sec for initFeedbacks() to finish
		})
		this.tcpClient.onDisconnect(() => {
			this.clearPollStartTimeout()
			this.pollState.stop()
			this.tcpClient.clearQueue()
		})
		// Init TCP connection
		this.tcpClient.init(this.config.host, MIDI_PORT)

		// Init Companion module
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
	}

	async destroy() {
		this.clearPollStartTimeout()
		this.pollState.stop()
		this.tcpClient.clearQueue()
		this.tcpClient.destroy()
		this.AHMState.reset() // Clear out DSP state
		log.debug('Destroyed')
	}

	async configUpdated(config) {
		this.config = config

		this.AHMState.reset() // Clear out DSP state

		this.configureRuntime()

		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
		this.tcpClient.init(this.config.host, MIDI_PORT)
	}

	configureRuntime() {
		this.configureDevice()
		this.configurePoller()
		this.registerContext()
		this.configureManualTracking()
		log.info('Configured', { ahmType: `AHM-${this.config.ahm_type}` })
	}

	configureDevice() {
		// Default to 64 inputs/zones when no valid AHM type is configured.
		this.numberOfInputs = parseInt(this.config.ahm_type) || 64
		this.numberOfZones = parseInt(this.config.ahm_type) || 64
		this.numberOfControlGroups = 32
	}

	configureManualTracking() {
		this.AHMState.setManualTracking(ChannelType.Input, this.config.manTrackInputs)
		this.AHMState.setManualTracking(ChannelType.Zone, this.config.manTrackZones)
		this.AHMState.setManualTracking(ChannelType.ControlGroup, this.config.manTrackCGs)
	}

	configurePoller() {
		this.clearPollStartTimeout()
		this.pollState?.stop()
		this.pollState = pollStateTimer(
			() => this.tcpClient,
			this.config.pollRate,
			(err) => log.error('PollerError', { message: err.message ?? err }),
		)
	}

	registerContext() {
		initContext({
			tcpClient: this.tcpClient,
			state: this.AHMState,
			companion: {
				checkFeedbacks: (...a) => this.checkFeedbacks(...a),
				log: (...a) => this.log(...a),
				updateStatus: (...a) => this.updateStatus(...a),
				setVariableValues: (...a) => this.setVariableValues(...a),
			},
			poller: this.pollState,
		})
	}

	clearPollStartTimeout() {
		if (!this.pollStartTimeout) return

		clearTimeout(this.pollStartTimeout)
		this.pollStartTimeout = null
	}

	getConfigFields() {
		return configFields
	}

	initVariables() {
		const [definitions, initValues] = getVariables(
			this.config.manTrackInputs ?? [],
			this.config.manTrackZones ?? [],
			this.config.manTrackCGs ?? [],
		)
		this.setVariableDefinitions(definitions)
		this.setVariableValues(initValues)
	}

	initFeedbacks() {
		this.setFeedbackDefinitions(getFeedbacks(this.numberOfInputs, this.numberOfZones, this.numberOfControlGroups))
	}

	initPresets() {
		getPresets(this) // this.setPresetDefinitions now lives in presets.js
	}

	initActions() {
		this.setActionDefinitions(getActions(this.numberOfInputs, this.numberOfZones, this.numberOfControlGroups))
	}
}

export const UpgradeScripts = upgradeScripts
