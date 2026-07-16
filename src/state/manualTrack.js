import { ChannelType } from '../utility/constants.js'
import { parseIDsToArray, getChannelTypeName } from '../utility/helpers.js'

export function createManualTracking(state) {
	/**
	 * Loads manually-tracked channels into state, overwriting
	 * @param {ChannelType} type - ChannelType
	 * @param {String} channels - comma-separated string of channel numbers (1-indexed)
	 */
	function setManualTracking(type, channels) {
		// invalid parameters, clear manually tracked channels for this type
		if (!channels || (typeof channels !== 'string' && !Array.isArray(channels))) {
			state.manuallyTrackedChannels[type] = []
			return
		}

		// parse into number array (still 1-indexed here)
		const trackingArray = parseIDsToArray(channels)
		console.log(
			`Manually tracking ${getChannelTypeName(type)} ${trackingArray}`,
		)

		// subtract 1 from each channel number to convert to 0-indexed
		for (let i = 0; i < trackingArray.length; i++) {
			trackingArray[i] -= 1
		}

		// store the manually tracked channels in state
		state.manuallyTrackedChannels[type] = trackingArray

		// add channels to auto tracking
		for (const m of trackingArray) {
			state.addChannel(type, m)
		}
	}

	/**
	 * Checks if channel of ChannelType is being manually tracked
	 * @param {ChannelType} type
	 * @param {Number} id
	 * @returns {Boolean}
	 */
	function isManuallyTracked(type, id) {
		return state.manuallyTrackedChannels[type]?.includes(id) ?? false
	}

	return {
		setManualTracking,
		isManuallyTracked,
	}
}
