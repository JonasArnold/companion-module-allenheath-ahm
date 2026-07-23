import { Colors } from './utility/constants.js'
import { FeedbackId } from './feedbacks.js'
import { ActionId } from './actions.js'

/**
 * Generates an array of template values with the specified prefix and count
 * @param {String} namePrefix - Maximum value to generate
 * @param {Number} maxValue - Number of values to generate
 * @returns {Array} - Array of template values
 */
function getTemplateValueArray(namePrefix, maxValue) {
	let array = []

	for (let i = 1; i <= maxValue; i++) {
		let currentValue = i
		array.push({
			name: `${namePrefix} ${currentValue}`,
			value: currentValue,
		})
	}

	return array
}

export function getPresets(self) {
	let presets = []

	// Mute Inputs
	presets[`muteInput`] = {
		type: 'simple',
		name: `Mute Input X`,
		options: {},
		style: {
			text: `Mute Input\n$(local:input)`,
			size: '12',
			color: Colors.White,
			bgcolor: Colors.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.MuteInput,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:input)`,
							},
							mute: true,
						},
					},
				],
				up: [],
			},
			{
				down: [
					{
						actionId: ActionId.MuteInput,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:input)`,
							},
							mute: false,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.InputMute,
				options: {
					input: {
						isExpression: true,
						value: `$(local:input)`,
					},
				},
				style: {
					color: Colors.White,
					bgcolor: Colors.Red,
				},
			},
		],
		localVariables: [
			{
				variableType: 'simple',
				variableName: 'input',
				startupValue: 1,
			},
		],
	}

	// Mute Zones
	presets[`muteZone`] = {
		type: 'simple',
		name: `Mute Zone X`,
		options: {},
		style: {
			text: `Mute Zone\n$(local:zone)`,
			size: '12',
			color: Colors.White,
			bgcolor: Colors.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.MuteZone,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:zone)`,
							},
							mute: true,
						},
					},
				],
				up: [],
			},
			{
				down: [
					{
						actionId: ActionId.MuteZone,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:zone)`,
							},
							mute: false,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.ZoneMute,
				options: {
					zone: {
						isExpression: true,
						value: `$(local:zone)`,
					},
				},
				style: {
					color: Colors.White,
					bgcolor: Colors.Red,
				},
			},
		],
		localVariables: [
			{
				variableType: 'simple',
				variableName: 'zone',
				startupValue: 1,
			},
		],
	}

	// Mute Control Groups
	presets[`muteCG`] = {
		type: 'simple',
		name: `Mute CG X`,
		options: {},
		style: {
			text: `Mute Control Group\n$(local:cg)`,
			size: '12',
			color: Colors.White,
			bgcolor: Colors.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.MuteControlGroup,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:cg)`,
							},
							mute: true,
						},
					},
				],
				up: [],
			},
			{
				down: [
					{
						actionId: ActionId.MuteControlGroup,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:cg)`,
							},
							mute: false,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.ControlGroupMute,
				options: {
					cg: {
						isExpression: true,
						value: `$(local:cg)`,
					},
				},
				style: {
					color: Colors.White,
					bgcolor: Colors.Red,
				},
			},
		],
		localVariables: [
			{
				variableType: 'simple',
				variableName: 'cg',
				startupValue: 1,
			},
		],
	}

	// Mute input to Zone
	presets[`muteInputToZone`] = {
		type: 'simple',
		name: `Mute Input X to Zone Y`,
		options: {},
		style: {
			text: `Mute\nInput $(local:input)\n to Zone $(local:zone)`,
			size: '12',
			color: Colors.White,
			bgcolor: Colors.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.MuteInputToZone,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:input)`,
							},
							number: {
								isExpression: true,
								value: `$(local:zone)`,
							},
							mute: true,
						},
					},
				],
				up: [],
			},
			{
				down: [
					{
						actionId: ActionId.MuteInputToZone,
						options: {
							mute_number: {
								isExpression: true,
								value: `$(local:input)`,
							},
							number: {
								isExpression: true,
								value: `$(local:zone)`,
							},
							mute: false,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.InputToZoneMute,
				options: {
					input: {
						isExpression: true,
						value: `$(local:input)`,
					},
					zone: {
						isExpression: true,
						value: `$(local:zone)`,
					},
				},
				style: {
					color: Colors.White,
					bgcolor: Colors.Red,
				},
			},
		],
		localVariables: [
			{
				variableType: 'simple',
				variableName: 'input',
				startupValue: 1,
			},
			{
				variableType: 'simple',
				variableName: 'zone',
				startupValue: 1,
			},
		],
	}

	// Generate preset structure
	// Note: Keep categories small. Opening them registers all feedbacks
	// and can overload the AHM with TCP requests.

	const structure = []

	structure.push({
		id: 'inputMutes',
		name: 'Input Mutes',
		definitions: [
			{
				id: 'inputMutes',
				type: 'template',
				presetId: 'muteInput',
				templateVariableName: 'input',
				templateValues: getTemplateValueArray('Mute Input', self.numberOfInputs),
			},
		],
	})

	structure.push({
		id: 'zoneMutes',
		name: 'Zone Mutes',
		definitions: [
			{
				id: 'zoneMutes',
				type: 'template',
				presetId: 'muteZone',
				templateVariableName: 'zone',
				templateValues: getTemplateValueArray('Mute Zone', self.numberOfZones),
			},
		],
	})

	structure.push({
		id: 'cgMutes',
		name: 'Control Group Mutes',
		definitions: [
			{
				id: 'cgMutes',
				type: 'template',
				presetId: 'muteCG',
				templateVariableName: 'cg',
				templateValues: getTemplateValueArray('Mute CG', self.numberOfControlGroups),
			},
		],
	})

	for (let z = 1; z <= self.numberOfZones; z++) {
		structure.push({
			id: `muteSendToZone${z}`,
			name: `Mute Input to Zone ${z}`,
			definitions: [
				{
					id: `muteSendToZone${z}`,
					type: 'template',
					presetId: 'muteInputToZone',
					templateVariableName: 'input',
					templateValues: getTemplateValueArray('Mute Input', self.numberOfInputs),
					commonVariableValues: {
						zone: z,
					},
				},
			],
		})
	}

	// return presets in API 2.0 structure
	self.setPresetDefinitions(structure, presets)
}
