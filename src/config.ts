import { Regex } from '@companion-module/base'
import type { SomeCompanionConfigField } from '@companion-module/base'
import { DEFAULT_MODEL_ID, getAHMModelChoices, isAHMModelId } from './models.js'

export interface AHMConfig {
	host: string
	ahm_type: 'ahm16' | 'ahm32' | 'ahm64'
	fetch_variables_on_startup: boolean
}

export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP',
			width: 6,
			default: '',
			regex: Regex.IP,
		},
		{
			type: 'dropdown',
			id: 'ahm_type',
			label: 'Type of Device (Re-enable required after change)',
			tooltip: 'Select the variant of the AHM that is connected. Amount of Inputs and Zones will be altered accordingly.',
			width: 6,
			choices: getAHMModelChoices(),
			default: DEFAULT_MODEL_ID,
		},
		{
			type: 'checkbox',
			id: 'fetch_variables_on_startup',
			label: 'Fetch variables on startup',
			tooltip: 'Request values for all variables when establishing a connection to an AHM. Feedbacks are always requested.',
			width: 6,
			default: true,
		},
	]
}

export function normalizeConfig(config: Partial<AHMConfig> | undefined): AHMConfig {
	const normalizedConfig: AHMConfig = {
		host: config?.host ?? '',
		ahm_type: isAHMModelId(config?.ahm_type) ? config.ahm_type : DEFAULT_MODEL_ID,
		fetch_variables_on_startup: config?.fetch_variables_on_startup !== false,
	}

	console.log(`[CONFIG] normalized: ${JSON.stringify(normalizedConfig)}`)

	return normalizedConfig
}
