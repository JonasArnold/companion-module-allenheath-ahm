export type AHMModelId = 'ahm16' | 'ahm32' | 'ahm64'

export interface AHMModelDefinition {
	id: AHMModelId
	label: string
	numberOfInputs: number
	numberOfZones: number
	numberOfControlGroups: number
}

const MODEL_DEFINITIONS: Record<AHMModelId, AHMModelDefinition> = {
	ahm16: {
		id: 'ahm16',
		label: 'AHM-16',
		numberOfInputs: 16,
		numberOfZones: 16,
		numberOfControlGroups: 32,
	},
	ahm32: {
		id: 'ahm32',
		label: 'AHM-32',
		numberOfInputs: 32,
		numberOfZones: 32,
		numberOfControlGroups: 32,
	},
	ahm64: {
		id: 'ahm64',
		label: 'AHM-64',
		numberOfInputs: 64,
		numberOfZones: 64,
		numberOfControlGroups: 32,
	},
}

export const DEFAULT_MODEL_ID: AHMModelId = 'ahm64'

export function isAHMModelId(value: unknown): value is AHMModelId {
	return typeof value === 'string' && value in MODEL_DEFINITIONS
}

export function getAHMModel(modelId: unknown): AHMModelDefinition {
	return isAHMModelId(modelId) ? MODEL_DEFINITIONS[modelId] : MODEL_DEFINITIONS[DEFAULT_MODEL_ID]
}

export function getAHMModelChoices() {
	return Object.values(MODEL_DEFINITIONS).map((model) => ({
		id: model.id,
		label: model.label,
	}))
}

