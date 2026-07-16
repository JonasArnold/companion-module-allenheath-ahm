import { ChannelType } from '../utility/constants.js'

export function createAutoTracking(state) {
	// CHANNELS //

	/**
	 * Adds channel to tracked parameters
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel id (0-indexed)
	 */
	function addChannel(type, id) {
		if (!state.trackedChannels[type].has(id)) {
			state.trackedChannels[type].set(id, {
				level: 0,
				mute: false,
				sends: new Map(),
			})
			return { isNew: true, channel: state.trackedChannels[type].get(id) }
		}

		return { isNew: false, channel: state.trackedChannels[type].get(id) }
	}

	/**
	 * Removes channel from tracked parameters
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel id (0-indexed)
	 */
	function removeChannel(type, id) {
		if (state.manuallyTrackedChannels[type].includes(id)) return

		state.trackedChannels[type]?.delete(id)
		console.log(`Deleting from map ${type} id: ${id}`)
	}

	/**
	 * Stores channel information in tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel id (0-indexed)
	 * @param {String} level - level of channel in dBu
	 * @param {Boolean} mute - incoming mute status of channel
	 */
	function setChannel(type, id, level, mute) {
		let channel = state.trackedChannels[type]?.get(id)
		if (!state.trackedChannels[type].has(id)) {
			console.log('setChannel BAIL - not tracked:', type, id)
			return
		}

		if (level !== undefined) channel.level = level
		if (mute !== undefined) channel.mute = mute
		console.log('setChannel WROTE - type:', type, 'id:', id, 'level:', level, 'mute:', mute)
	}

	/**
	 * Get map of tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @returns {Map} Map of tracked channels by type
	 */
	function getTrackedChannelMap(type) {
		return state.trackedChannels[type]
	}

	/**
	 * Get level of channel from tracked channels
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @param {Number} id - channel id (0-indexed)
	 * @returns {Number} Level of channel as integer from API guide
	 */
	function getLevel(type, id) {
		return state.trackedChannels[type]?.get(id)?.level ?? 0
	}

	/**
	 * Get mute status of channel from tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel id (0-indexed)
	 * @returns {Boolean} Mute status of channel
	 */
	function getMute(type, id) {
		return state.trackedChannels[type]?.get(id)?.mute ?? false
	}

	// SENDS //

	/**
	 * Adds an input or zone send to be tracked
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @param {Number} idFrom - From channel id (0-indexed)
	 * @param {Number} idTo - To channel id (0-indexed)
	 */
	function addSend(type, idFrom, idTo) {
		const { channel } = addChannel(type, idFrom)
		if (!channel.sends) {
			channel.sends = new Map()
		}
		const isNew = !channel.sends?.has(idTo)

		const existing = channel.sends.get(idTo)
		console.log('addSend - existing:', existing, 'initialized:', existing?.initialized)

		if (isNew) {
			channel.sends.set(idTo, {
				level: 0,
				mute: false,
				initialized: false,
			})
		}

		const send = channel.sends.get(idTo)
		return { isNew: !send.initialized, send }
	}

	/**
	 * Removed an input or zone send from tracking
	 * @param {ChannelType} typeFrom - ChannelType (Input or Zone)
	 * @param {Number} idFrom - From channel id (0-indexed)
	 * @param {Number} idTo - To channel id (0-indexed)
	 */
	function removeSend(type, idFrom, idTo) {
		const channel = state.trackedChannels[type]?.get(idFrom)
		if (!channel) return

		channel.sends.delete(idTo)
	}

	/**
	 * Updates send information in tracked channels
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @param {Number} idFrom - From channel id (0-indexed)
	 * @param {Number} idTo - To channel id (0-indexed)
	 * @param {String} level
	 * @param {Boolean} mute
	 */
	function setSend(type, idFrom, idTo, level, mute) {
		const { send } = addSend(type, idFrom, idTo)

		if (level !== undefined) send.level = level
		if (mute !== undefined) send.mute = mute
		send.initialized = true
		console.log(
			'setSend - type:',
			type,
			'idFrom:',
			idFrom,
			'idTo:',
			idTo,
			'level:',
			send.level,
			'initialized:',
			send.initialized,
		)
	}

	/**
	 * Get list of tracked sends for a specific channel type
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @returns {Number[]} Array of tracked sends for specified channel
	 */
	function getAllSendStates(type) {
		const results = []
		const channels = state.trackedChannels[type]
		if (!(channels instanceof Map)) {
			return results
		}

		console.log('state.trackedChannels[type]', state.trackedChannels[type])
		console.log('isMap', state.trackedChannels[type] instanceof Map)

		for (const [idFrom, channel] of channels) {
			if (!(channel.sends instanceof Map)) continue

			for (const [idTo, send] of channel.sends) {
				results.push({
					idFrom,
					idTo,
					send,
				})
			}
		}

		return results
	}

	/**
	 * Get level of channel send from tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel id (0-indexed)
	 * @returns {Number} Level of channel as integer from API guide
	 */
	function getSendLevel(type, idFrom, idTo) {
		return state.trackedChannels[type]?.get(idFrom)?.sends?.get(idTo)?.level ?? 0
	}

	/**
	 * Get mute status of channel send from tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel id (0-indexed)
	 * @returns {Boolean} Mute status of channel
	 */
	function getSendMute(type, idFrom, idTo) {
		return state.trackedChannels[type]?.get(idFrom)?.sends?.get(idTo)?.mute ?? false
	}

	// PRESETS //

	/**
	 * Updates the state of the last preset number recalled
	 * @param {Number} num - Preset number (1-indexed)
	 */
	function setPreset(num) {
		state.lastPreset = num
	}

	/**
	 * Gets the last recalled preset
	 * @returns {Number} The last preset recalled (1-indexed)
	 */
	function getPreset() {
		return state.lastPreset
	}

	return {
		addChannel,
		removeChannel,
		setChannel,
		addSend,
		removeSend,
		setSend,
		getTrackedChannelMap,
		getAllSendStates,
		getLevel,
		getMute,
		getSendLevel,
		getSendMute,
		setPreset,
		getPreset,
	}
}
