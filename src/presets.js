import { Colors } from './utility/constants.js'
import { FeedbackId } from './feedbacks.js'
import { ActionId } from './actions.js'

function getTemplateValueArray(namePrefix, numValues, offset) {
	let array = []

	for (let i = 0; i < numValues; i++) {
		let currentValue = i + offset
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
			text: `Mute Input $(local:input)`,
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
								value: `$(local:input) - 1`,
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
								value: `$(local:input) - 1`,
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
						value: `$(local:input) - 1`,
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
			text: `Mute Zone $(local:zone)`,
			size: '14',
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
								value: `$(local:zone) - 1`,
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
								value: `$(local:zone) - 1`,
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
						value: `$(local:zone) - 1`,
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
			text: `Mute Control Group $(local:cg)`,
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
								value: `$(local:cg) - 1`,
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
								value: `$(local:cg) - 1`,
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
						value: `$(local:cg) - 1`,
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
			text: `Mute Input $(local:input) to Zone $(local:zone)`,
			size: '10',
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
								value: `$(local:input) - 1`,
							},
							number: {
								isExpression: true,
								value: `$(local:zone) - 1`,
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
								value: `$(local:input) - 1`,
							},
							number: {
								isExpression: true,
								value: `$(local:zone) - 1`,
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
						value: `$(local:input) - 1`,
					},
					zone: {
						isExpression: true,
						value: `$(local:zone) - 1`,
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

	const structure = []

	structure.push({
		id: 'inputMutes',
		name: 'Input Mutes',
		definitions: [
			{
				id: 'inputMutes',
				// name: 'Input Mutes',
				type: 'template',
				presetId: 'muteInput',
				templateVariableName: 'input',
				templateValues: getTemplateValueArray('Mute Input', self.numberOfInputs, 1),
			},
		],
	})

	structure.push({
		id: 'zoneMutes',
		name: 'Zone Mutes',
		definitions: [
			{
				id: 'zoneMutes',
				// name: 'Zone Mutes',
				type: 'template',
				presetId: 'muteZone',
				templateVariableName: 'zone',
				templateValues: getTemplateValueArray('Mute Zone', self.numberOfZones, 1),
			},
		],
	})

	structure.push({
		id: 'cgMutes',
		name: 'Control Group Mutes',
		definitions: [
			{
				id: 'cgMutes',
				// name: 'Control Group Mutes',
				type: 'template',
				presetId: 'muteCG',
				templateVariableName: 'cg',
				templateValues: getTemplateValueArray('Mute CG', self.numberOfControlGroups, 1),
			},
		],
	})

	for (let z = 0; z < self.numberOfZones; z++) {
		structure.push({
			id: `muteSendToZone${z + 1}`,
			name: `Mute Input to Zone ${z + 1}`,
			definitions: [
				{
					id: `muteSendToZone${z + 1}`,
					// name: `Mute Input to Zone ${z + 1}`,
					type: 'template',
					presetId: 'muteInputToZone',
					templateVariableName: 'input',
					templateValues: getTemplateValueArray('Mute Input', self.numberOfInputs, 1),
					commonVariableValues: {
						zone: z + 1,
					},
				},
			],
		})
	}

	// return presets in API 2.0 structure
	self.setPresetDefinitions(structure, presets)
}
