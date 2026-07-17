import { Colors } from './utility/constants.js'
import { FeedbackId } from './feedbacks.js'
import { ActionId } from './actions.js'

export function getPresets(numberOfInputs, numberOfZones, numberOfControlGroups) {
	let presets = []

	// Mute Inputs
	for (let index = 0; index < numberOfInputs; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Input',
			name: `Mute Input ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Input ${parseInt(index) + 1}`,
				size: '14',
				color: Colors.White,
				bgcolor: Colors.Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.MuteInput,
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
							actionId: ActionId.MuteInput,
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
					feedbackId: FeedbackId.InputMute,
					options: {
						input: index,
					},
					style: {
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		})
	}

	// Mute Zones
	for (let index = 0; index < numberOfZones; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Zones',
			name: `Mute Zone ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Zone ${parseInt(index) + 1}`,
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
							actionId: ActionId.MuteZone,
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
					feedbackId: FeedbackId.ZoneMute,
					options: {
						zone: parseInt(index),
					},
					style: {
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		})
	}

	// Mute Control Groups
	for (let index = 0; index < numberOfControlGroups; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Control Groups',
			name: `Mute CG ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Control Group ${parseInt(index) + 1}`,
				size: '14',
				color: Colors.White,
				bgcolor: Colors.Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.MuteControlGroup,
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
							actionId: ActionId.MuteControlGroup,
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
					feedbackId: FeedbackId.ControlGroupMute,
					options: {
						cg: parseInt(index),
					},
					style: {
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		})
	}

	// Mute input to Zone
	for (let input = 0; input < numberOfInputs; input++) {
		for (let zone = 0; zone < numberOfZones; zone++) {
			presets.push({
				type: 'button',
				category: `Mute Input ${parseInt(input) + 1} to Zone`,
				name: `Mute Input ${parseInt(input) + 1} to Zone ${parseInt(zone) + 1}`,
				options: {},
				style: {
					text: `Mute Input ${parseInt(input) + 1} to Zone ${parseInt(zone) + 1}`,
					size: '14',
					color: Colors.White,
					bgcolor: Colors.Black,
				},
				steps: [
					{
						down: [
							{
								actionId: ActionId.MuteInputToZone,
								options: {
									mute_number: parseInt(input),
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
								actionId: ActionId.MuteInputToZone,
								options: {
									mute_number: parseInt(input),
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
						feedbackId: FeedbackId.InputToZoneMute,
						options: {
							input: parseInt(input),
							zone: zone,
						},
						style: {
							color: Colors.White,
							bgcolor: Colors.Red,
						},
					},
				],
			})
		}
	}
	return presets
}
