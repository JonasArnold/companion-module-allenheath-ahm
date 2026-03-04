// @ts-nocheck
import { InstanceBase, InstanceStatus } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import { getConfigFields as getModuleConfigFields, noConnectionConfig, normalizeConfig, type AHMConfig } from './config.js'
import { AHMMatrix } from './matrix/matrix.js'

export class AHMInstance extends InstanceBase<AHMConfig> {
	constructor(internal) {
		super(internal)
		this.config = noConnectionConfig()
		this.matrix = null
		this._firstStart = true
	}

	async init(config) {
		this.updateStatus(InstanceStatus.Connecting)
		await this.configUpdated(config)
	}

	async destroy() {
		this.matrix?.stop()
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		const oldConfig = this.config
		const newConfig = normalizeConfig(config)
		const hostChanged = oldConfig.host !== newConfig.host
		const modelChanged = oldConfig.ahm_type !== newConfig.ahm_type
		const shouldStopBeforeReconfigure = !this._firstStart && (hostChanged || modelChanged)

		this.config = newConfig

		if (!this.matrix){
			if (shouldStopBeforeReconfigure){
				this.matrix.stop('Matrix connection restarting for configuration update...')
			}
		}

		this.matrix = new AHMMatrix(this)
		this.matrix.updateConfig(this.config)
		this.log('info', `Set Unit Type to ${this.matrix.model.label}.`)

		this.initVariables()
		this.initActions()
		this.initFeedbacks()
		this.initPresets()

		this.matrix.start()
		this._firstStart = false
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
}
