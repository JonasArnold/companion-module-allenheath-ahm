import { ChannelType } from '../utility/constants.js'
import { createState } from './core.js'
import { createTracking } from './tracking.js'

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
