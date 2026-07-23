import { ChannelType } from '../utility/constants.js'
import { createTracking } from './tracking.js'

/**
 * Creates initial state object
 * @returns State object
 */
function createState() {
	return {
		trackedChannels: {
			[ChannelType.Input]: new Map(),
			[ChannelType.Zone]: new Map(),
			[ChannelType.ControlGroup]: new Map(),
		},
		lastPreset: 0,
	}
}

/**
 * Factory function tracking input, zone, and control group levels and mutes
 * @returns Internal helper functions
 */
export function trackAHMParams() {
	const state = createState()

	Object.assign(state, createTracking(state))

	function reset() {
		Object.assign(state, createState())
	}

	return {
		state,
		reset,
		...state,
	}
}
