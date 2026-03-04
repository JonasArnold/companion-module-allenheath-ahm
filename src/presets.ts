import { combineRgb } from '@companion-module/base'

export function getPresets() {
	let presets = []

	const ColorWhite = combineRgb(255, 255, 255)
	const ColorBlack = combineRgb(0, 0, 0)
	const ColorRed = combineRgb(200, 0, 0)

	// Mute Inputs
	for (let index = 0; index < this.matrix.model.numberOfInputs; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Input',
			name: `Mute Input ${index + 1}`,
			options: {},
			style: {
				text: `Mute Input ${index + 1}`,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mute_input',
							options: {
								mute_number: index,
								mute: true,
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'mute_input',
							options: {
								mute_number: index,
								mute: false,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'inputMute',
					options: {
						input: index + 1,
					},
					style: {
						color: ColorWhite,
						bgcolor: ColorRed,
					},
				},
			],
		})
	}

	// Mute Zones
	for (let index = 0; index < this.matrix.model.numberOfZones; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Zones',
			name: `Mute Zone ${index + 1}`,
			options: {},
			style: {
				text: `Mute Zone ${index + 1}`,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mute_zone',
							options: {
								mute_number: index,
								mute: true,
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'mute_zone',
							options: {
								mute_number: index,
								mute: false,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'zoneMute',
					options: {
						zone: index + 1,
					},
					style: {
						color: ColorWhite,
						bgcolor: ColorRed,
					},
				},
			],
		})
	}

	// Mute Control Groups
	for (let index = 0; index < this.matrix.model.numberOfControlGroups; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Control Groups',
			name: `Mute CG ${index + 1}`,
			options: {},
			style: {
				text: `Mute Control Group ${index + 1}`,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mute_controlgroup',
							options: {
								mute_number: index,
								mute: true,
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'mute_controlgroup',
							options: {
								mute_number: index,
								mute: false,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'cgMute',
					options: {
						cg: index + 1,
					},
					style: {
						color: ColorWhite,
						bgcolor: ColorRed,
					},
				},
			],
		})
	}

	// Mute input to Zone
	for (let input = 0; input < this.matrix.model.numberOfInputs; input++) {
		for (let zone = 0; zone < this.matrix.model.numberOfZones; zone++) {
			presets.push({
				type: 'button',
				category: `Mute Input ${input + 1} to Zone`,
				name: `Mute Input ${input + 1} to Zone ${zone + 1}`,
				options: {},
				style: {
					text: `Mute Input ${input + 1} to Zone ${zone + 1}`,
					size: '14',
					color: ColorWhite,
					bgcolor: ColorBlack,
				},
				steps: [
					{
						down: [
							{
								actionId: 'input_to_zone',
								options: {
									mute_number: input,
									number: zone,
									mute: true,
								},
							},
						],
						up: [],
					},
					{
						down: [
							{
								actionId: 'input_to_zone',
								options: {
									mute_number: input,
									number: zone,
									mute: false,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'inputToZoneMute',
						options: {
							input: input + 1,
							zone: zone + 1,
						},
						style: {
							color: ColorWhite,
							bgcolor: ColorRed,
						},
					},
				],
			})
		}
	}
	return presets
}
