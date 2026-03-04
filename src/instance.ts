import { InstanceBase, InstanceStatus } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import { getConfigFields as getModuleConfigFields, noConnectionConfig, normalizeConfig, type AHMConfig } from './config.js'
import { AHMMatrix } from './matrix/matrix.js'

export class AHMInstance extends InstanceBase<AHMConfig> {
	config: AHMConfig
	matrix: AHMMatrix | null 

	constructor(internal: any) {
		super(internal)
		this.config = noConnectionConfig()
		this.matrix = null
	}

	override async destroy(): Promise<void> {
		if (this.matrix !== null) {
			this.matrix.stop('Module connection destroyed')
			this.matrix = null
		}
	}

	override async init(config: AHMConfig) {
		this.updateStatus(InstanceStatus.Connecting)
		await this.configUpdated(config)
	}

	override getConfigFields(){
		return getModuleConfigFields()
	}

	override async configUpdated(config: AHMConfig) {
		const oldConfig = this.config
		const newConfig = normalizeConfig(config)
		const hostChanged = oldConfig.host !== newConfig.host
		const modelChanged = oldConfig.ahm_type !== newConfig.ahm_type
		const canUpdateConfigWithoutRestarting = !(hostChanged || modelChanged)

		this.config = newConfig

		if (this.matrix !== null) {
			if (canUpdateConfigWithoutRestarting) {
				return
			}

			this.matrix.stop('Matrix connection restarting for configuration update...')
		}

		this.matrix = new AHMMatrix(this)
		this.matrix.updateConfig(this.config)
		this.log('info', `Set Unit Type to ${this.matrix.model.label}.`)

		this.#initVariables()
		this.#initActions()
		this.#initFeedbacks()
		this.#initPresets()

		this.matrix.start()
	}

	#initVariables() {
		const [definitions, initValues] = getVariables.bind(this)()
		this.setVariableDefinitions(definitions)
		this.setVariableValues(initValues)
	}

	#initFeedbacks() {
		const feedbacks = getFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	#initPresets() {
		const presets = getPresets.bind(this)()
		this.setPresetDefinitions(presets)
	}

	#initActions() {
		const actions = getActions.bind(this)()
		this.setActionDefinitions(actions)
	}
}
