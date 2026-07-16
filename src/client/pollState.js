import { ChannelType, Priority, SendInfoType, SendType } from '../utility/constants.js'
import { requestLevelInfo, requestMuteInfo } from '../formatMIDI/channels.js'
import { requestSendInfo } from '../formatMIDI/sends.js'
import { getContext } from '../context.js'

const LOG_PREFIX = '[State Poller]'
const log = (message) => console.log(`${LOG_PREFIX} ${message}`)

/**
 * AHM state polling factory function.
 * @param {Function} getSocket - Returns the current TCP socket
 * @param {Number} interval - Poll rate in ms
 * @param {*} onError
 * @returns {Function[]}
 */
export function pollStateTimer(getSocket, interval = 10000, onError = console.error) {
	let stopped = false
	let timeout = null

	async function tick() {
		if (stopped) return
		const { state } = getContext()

		try {
			const socket = getSocket()

			if (!socket || socket.destroyed || !socket.queue) {
				throw new Error('Socket is not connected')
			}

			const inputChannels = state.getTrackedChannelMap(ChannelType.Input)
			const zoneChannels = state.getTrackedChannelMap(ChannelType.Zone)
			const controlGroups = state.getTrackedChannelMap(ChannelType.ControlGroup)
			const inputToZoneSends = state.getTrackedSends(ChannelType.Input)
			const zoneToZoneSends = state.getTrackedSends(ChannelType.Zone)
			const channelCount = inputChannels.size + zoneChannels.size + controlGroups.size
			const sendCount = inputToZoneSends.length + zoneToZoneSends.length

			const requests = [
				...buildChannelRequests(ChannelType.Input, inputChannels),
				...buildChannelRequests(ChannelType.Zone, zoneChannels),
				...buildChannelRequests(ChannelType.ControlGroup, controlGroups),
				...buildSendRequests(SendType.InputToZone, inputToZoneSends),
				...buildSendRequests(SendType.ZoneToZone, zoneToZoneSends),
			]

			for (const req of requests) {
				socket.queue(req, Priority.LOW)
			}

			log(`Inputs: ${formatChannelIds(inputChannels)}`)
			log(`Zones: ${formatChannelIds(zoneChannels)}`)
			log(`Control groups: ${formatChannelIds(controlGroups)}`)
			log(`Input -> Zone sends: ${formatSendIds(inputToZoneSends)}`)
			log(`Zone -> Zone sends: ${formatSendIds(zoneToZoneSends)}`)
			log(`Queued ${requests.length} requests (${channelCount} channels, ${sendCount} sends)`)
		} catch (err) {
			onError(err)
		}
	}

	function formatChannelIds(channels) {
		return [...channels.keys()].map((id) => id + 1).join(', ') || '-'
	}

	function formatSendIds(sends) {
		return sends.map(({ idFrom, idTo }) => `${idFrom + 1}->${idTo + 1}`).join(', ') || '-'
	}

	function buildChannelRequests(type, ids) {
		const requests = []

		for (const [id] of ids) {
			requests.push(requestLevelInfo(type, id), requestMuteInfo(type, id))
		}

		return requests
	}

	function buildSendRequests(type, sends) {
		const requests = []

		for (const { idFrom, idTo } of sends) {
			requests.push(
				requestSendInfo(type, SendInfoType.LEVEL, idFrom, idTo),
				requestSendInfo(type, SendInfoType.MUTE, idFrom, idTo),
			)
		}

		return requests
	}

	async function poll() {
		if (stopped) return

		await tick()

		scheduleNextPoll()
	}

	function scheduleNextPoll() {
		if (stopped) return

		clearTimeout(timeout)

		timeout = setTimeout(async () => {
			await tick()
			scheduleNextPoll()
		}, interval)
	}

	function start() {
		stopped = false
		log(`Started with an interval of ${interval} ms`)
		poll()
	}

	function stop() {
		stopped = true

		if (timeout) {
			clearTimeout(timeout)
			timeout = null
		}

		log('Stopped')
	}

	return {
		start,
		stop,
		poll,
	}
}
