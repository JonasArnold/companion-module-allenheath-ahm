import { Colors } from './utility/constants.js'
import { FeedbackId } from './feedbacks.js'
import { ActionId } from './actions.js'

function getSimplePresetsArray(prefix, numPresets) {
	let array = []

	for (let i = 1; i < numPresets + 1; i++) {
		array.push(prefix + i)
	}

	return array
}

function getSimplePresetsArrayWithSends(prefix, numPresets, zone) {
	let array = []

	for (let i = 1; i < numPresets + 1; i++) {
		array.push(prefix + i + '-' + zone)
	}

	return array
}

export function getPresets(self) {
	let presets = []

	// Mute Inputs
	for (let i = 0; i < self.numberOfInputs; i++) {
		presets[`muteInput${i + 1}`] = {
			type: 'simple',
			name: `Mute Input ${i + 1}`,
			options: {},
			style: {
				text: `Mute Input ${i + 1}`,
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
								mute_number: i,
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
								mute_number: i,
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
						input: i,
					},
					style: {
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		}
	}

	// Mute Zones
	for (let i = 0; i < self.numberOfZones; i++) {
		presets[`muteZone${i + 1}`] = {
			type: 'simple',
			name: `Mute Zone ${i + 1}`,
			options: {},
			style: {
				text: `Mute Zone ${i + 1}`,
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
								mute_number: i,
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
								mute_number: i,
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
						zone: i,
					},
					style: {
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		}
	}

	// Mute Control Groups
	for (let i = 0; i < self.numberOfControlGroups; i++) {
		presets[`muteCG${i + 1}`] = {
			type: 'simple',
			name: `Mute CG ${i + 1}`,
			options: {},
			style: {
				text: `Mute Control Group ${i + 1}`,
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
								mute_number: i,
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
								mute_number: i,
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
						cg: i,
					},
					style: {
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		}
	}

	// Mute input to Zone
	for (let i = 0; i < self.numberOfInputs; i++) {
		for (let z = 0; z < self.numberOfZones; z++) {
			presets[`muteSend${i + 1}-${z + 1}`] = {
				type: 'simple',
				name: `Mute Input ${i + 1} to Zone ${z + 1}`,
				options: {},
				style: {
					text: `Mute Input ${i + 1} to Zone ${z + 1}`,
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
									mute_number: i,
									number: z,
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
									mute_number: i,
									number: z,
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
							input: i,
							zone: z,
						},
						style: {
							color: Colors.White,
							bgcolor: Colors.Red,
						},
					},
				],
			}
		}
	}

	const structure = []

	structure.push({
		id: 'inputMutes',
		name: 'Input Mutes',
		definitions: [
			{
				id: 'inputMutes',
				// name: 'Input Mutes',
				type: 'simple',
				presets: getSimplePresetsArray('muteInput', self.numberOfInputs),
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
				type: 'simple',
				presets: getSimplePresetsArray('muteZone', self.numberOfZones),
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
				type: 'simple',
				presets: getSimplePresetsArray('muteCG', self.numberOfControlGroups),
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
					type: 'simple',
					presets: getSimplePresetsArrayWithSends('muteSend', self.numberOfInputs, z + 1),
				},
			],
		})
	}

	// return presets in API 2.0 structure
	self.setPresetDefinitions(structure, presets)
}
