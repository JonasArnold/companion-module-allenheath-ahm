import { ChannelType, Priority, SendInfoType, SendType } from '../utility/constants.js'
import { requestLevelInfo, requestMuteInfo } from '../formatMIDI/channels.js'
import { requestSendInfo } from '../formatMIDI/sends.js'
import { getContext } from '../context.js'
import { createLogger } from '../utility/log.js'

const log = createLogger('PollState')

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

			log.debug(`Inputs: ${formatChannelNumbers(inputChannels)}`)
			log.debug(`Zones: ${formatChannelNumbers(zoneChannels)}`)
			log.debug(`Control groups: ${formatChannelNumbers(controlGroups)}`)
			log.debug(`Input -> Zone sends: ${formatSendNumbers(inputToZoneSends)}`)
			log.debug(`Zone -> Zone sends: ${formatSendNumbers(zoneToZoneSends)}`)
			log.debug(`Queued ${requests.length} requests (${channelCount} channels, ${sendCount} sends)`)
		} catch (err) {
			onError(err)
		}
	}

	function formatChannelNumbers(channels) {
		return [...channels.keys()].map((chNumber) => chNumber).join(', ') || '-'
	}

	function formatSendNumbers(sends) {
		return sends.map(({ fromChNum, toChNum }) => `${fromChNum}->${toChNum}`).join(', ') || '-'
	}

	function buildChannelRequests(type, channels) {
		const requests = []

		for (const [chNumber] of channels) {
			requests.push(requestLevelInfo(type, chNumber), requestMuteInfo(type, chNumber))
		}

		return requests
	}

	function buildSendRequests(type, sends) {
		const requests = []

		for (const { fromChNum, toChNum } of sends) {
			requests.push(
				requestSendInfo(type, SendInfoType.LEVEL, fromChNum, toChNum),
				requestSendInfo(type, SendInfoType.MUTE, fromChNum, toChNum),
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
		log.debug(`Started with an interval of ${interval} ms`)
		poll()
	}

	function stop() {
		stopped = true

		if (timeout) {
			clearTimeout(timeout)
			timeout = null
		}

		log.debug('Stopped')
	}

	return {
		start,
		stop,
		poll,
	}
}
