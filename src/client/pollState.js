import { ChannelType, Priority, SendInfoType, SendType } from '../utility/constants.js'
import { requestLevelInfo, requestMuteInfo } from '../formatMIDI/channels.js'
import { requestSendInfo } from '../formatMIDI/sends.js'
import { getContext } from '../context.js'

/**
 * AHM state polling factory function.
 * @param {*} socket
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

			const requests = [
				...buildChReqs(ChannelType.Input, state.getTrackedChannelMap(ChannelType.Input)),
				...buildChReqs(ChannelType.Zone, state.getTrackedChannelMap(ChannelType.Zone)),
				...buildChReqs(ChannelType.ControlGroup, state.getTrackedChannelMap(ChannelType.ControlGroup)),
				...buildSendReqs(SendType.InputToZone, state.getAllSendStates(ChannelType.Input)),
				...buildSendReqs(SendType.ZoneToZone, state.getAllSendStates(ChannelType.Zone)),
			]

			for (const req of requests) {
				socket.queue(req, Priority.LOW)
			}
		} catch (err) {
			onError(err)
		}
	}

	function buildChReqs(type, ids) {
		const requests = []

		for (const [id] of ids) {
			console.log('buildChReqs - type:', type, 'id:', id)
			requests.push(requestLevelInfo(type, id), requestMuteInfo(type, id))
		}

		return requests
	}

	function buildSendReqs(type, sends) {
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
		console.log('START POLLING')
		poll()
	}

	function stop() {
		stopped = true

		if (timeout) {
			clearTimeout(timeout)
			timeout = null
		}
	}

	return {
		start,
		stop,
		poll,
	}
}
