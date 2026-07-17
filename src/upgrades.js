import { CreateConvertToBooleanFeedbackUpgradeScript } from '@companion-module/base'

export default [
	CreateConvertToBooleanFeedbackUpgradeScript({
		inputMute: true,
		zoneMute: true,
		inputToZoneMute: true,
	}),
	function v2_1_0(context, props) {
		let changes = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		// update config
		if (props.config) {
			let config = props.config
			// ahm_type was introduced in this update, previous installations defaulted to ahm64
			if (config.ahm_type == undefined || config.ahm_type == '') {
				let defaultConfigType = 'ahm64'
				console.info(`Updating Configuration, AHM Type was ${config.ahm_type}. Now set to default (${defaultConfigType}).`)
				config.ahm_type = defaultConfigType
				changes.updatedConfig = config
			}
		}

		// update actions
		for (const action of props.actions) {
			// replace option with old name inputChannel with new option name mute_number
			if (action.actionId === 'mute_input' || action.actionId === 'mute_zone' || action.actionId === 'input_to_zone') {
				// check if the action has the option inputChannel (by checking if property exists)
				if (Object.hasOwn(action.options, 'inputChannel')) {
					console.info(`Updating Configuration, Found action with old option inputChannel=${action.options.inputChannel}, converting to new mute_number`)

					action.options.mute_number = action.options.inputChannel
					delete action.options.inputChannel

					changes.updatedActions.push(action)
				}
			}
		}

		return changes
	},
	function v2_2_0(context, props) {
		let changes = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		// update actions
		for (const action of props.actions) {
			// replace option with old name 'number' with new option name 'incdec_ch_number'
			if (action.actionId === 'inc_dec_level_input' || action.actionId === 'inc_dec_level_zone') {
				// check if the action has the option 'number' (by checking if property exists)
				if (Object.hasOwn(action.options, 'number')) {
					action.options.number = action.options.incdec_ch_number
					delete action.options.number

					changes.updatedActions.push(action)
				}
			}
			// replace option with old name 'number' with new option name 'setlvl_ch_number'
			if (action.actionId === 'set_level_input' || action.actionId === 'set_level_zone') {
				// check if the action has the option 'number' (by checking if property exists)
				if (Object.hasOwn(action.options, 'number')) {
					action.options.number = action.options.setlvl_ch_number
					delete action.options.number

					changes.updatedActions.push(action)
				}
			}
		}

		return changes
	},
	function v3_0_0(context, props) {
		let changes = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		// update config
		if (props.config) {
			let config = props.config

			// moving from 'ahm16' to '16', etc.
			if (config.ahm_type == 'ahm16') {
				config.ahm_type = '16'
			}
			if (config.ahm_type == 'ahm32') {
				config.ahm_type = '32'
			}
			if (config.ahm_type == 'ahm64') {
				config.ahm_type = '64'
			}

			// manually set refresh rate upon upgrade
			config.pollRate = 10000

			changes.updatedConfig = config
		}

		return changes
	},
]
