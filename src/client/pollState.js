import { ChannelType, Priority, SendInfoType, SendType } from '../utility/constants.js'
import { requestLevelInfo, requestMuteInfo } from '../formatMIDI/channels.js'
import { requestSendInfo } from '../formatMIDI/sends.js'
import { getContext } from '../context.js'
import { createLogger } from '../utility/log.js'

const log = createLogger('PollState')
const MIN_TICK_COOLDOWN_MS = 2000

/**
 * AHM state polling factory function.
 * @param {Function} getSocket - Returns the current TCP socket
 * @param {number} interval - Poll rate in ms
 * @param {Function} onError
 * @returns {{start: Function, stop: Function, poll: Function}}
 */
export function pollStateTimer(getSocket, interval = 10000, onError = console.error) {
	let stopped = true
	let timeout = null
	let running = false
	let lastTickStartedAt = 0
	let lastTickFinishedAt = 0

	/**
	 * Builds and queues all polling requests for the currently tracked channels and sends.
	 * Resolves after the TCP queue has sent every queued request.
	 * @param {string} reason - Describes why this tick was started
	 * @returns {Promise<void>}
	 */
	async function tick(reason) {
		if (stopped) return
		const { state } = getContext()

		try {
			const socket = getSocket()

			if (!socket || socket.destroyed || !socket.queue || socket.isConnected?.() === false) {
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
			log.debug(`Queued ${requests.length} requests (${channelCount} channels, ${sendCount} sends, reason: ${reason})`)

			await socket.waitUntilIdle?.()
			if (!stopped) {
				log.debug(
					`Finished ${requests.length} requests (${channelCount} channels, ${sendCount} sends, reason: ${reason})`,
				)
			}
		} catch (err) {
			if (!stopped) {
				onError(err)
			}
		}
	}

	/**
	 * Formats channel numbers for debug logging.
	 * @param {Map<number, *>} channels
	 * @returns {string}
	 */
	function formatChannelNumbers(channels) {
		return [...channels.keys()].map((chNumber) => chNumber).join(', ') || '-'
	}

	/**
	 * Formats send pairs for debug logging.
	 * @param {Array<{fromChNum: number, toChNum: number}>} sends
	 * @returns {string}
	 */
	function formatSendNumbers(sends) {
		return sends.map(({ fromChNum, toChNum }) => `${fromChNum}->${toChNum}`).join(', ') || '-'
	}

	/**
	 * Builds level and mute polling requests for a channel map.
	 * @param {ChannelType} type
	 * @param {Map<number, *>} channels
	 * @returns {Buffer[][]}
	 */
	function buildChannelRequests(type, channels) {
		const requests = []

		for (const [chNumber] of channels) {
			requests.push(requestLevelInfo(type, chNumber), requestMuteInfo(type, chNumber))
		}

		return requests
	}

	/**
	 * Builds level and mute polling requests for a send list.
	 * @param {SendType} type
	 * @param {Array<{fromChNum: number, toChNum: number}>} sends
	 * @returns {Buffer[][]}
	 */
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

	/**
	 * Runs one tick and records its timing.
	 * @param {string} reason - Describes why this tick was started
	 * @returns {Promise<boolean>} True when a tick ran
	 */
	async function runTick(reason) {
		if (stopped || running) return false

		running = true
		lastTickStartedAt = Date.now()
		try {
			await tick(reason)
			lastTickFinishedAt = Date.now()
			if (!stopped) {
				logIntervalWarningIfNeeded(lastTickStartedAt, lastTickFinishedAt)
			}
		} finally {
			running = false
		}

		return true
	}

	/**
	 * Requests an immediate poll while still honoring cooldown and running-tick guards.
	 * @returns {void}
	 */
	function poll() {
		if (stopped || running) return

		scheduleNextPoll('manual')
	}

	/**
	 * Schedules the next tick according to interval and cooldown timing.
	 * @param {string} reason - Describes why the scheduled tick should run
	 * @returns {void}
	 */
	function scheduleNextPoll(reason = 'timer') {
		if (stopped) return

		clearTimeout(timeout)

		const delay = getNextTickDelay(reason)

		timeout = setTimeout(async () => {
			timeout = null
			const didRun = await runTick(reason)
			if (didRun && !stopped) {
				scheduleNextPoll()
			}
		}, delay)
	}

	/**
	 * Calculates the delay until the next tick may start.
	 * @param {string} reason - Describes why the next tick should run
	 * @returns {number} Delay in ms
	 */
	function getNextTickDelay(reason) {
		if (reason === 'manual') return 0
		if (lastTickStartedAt === 0) return 0

		const nextByInterval = lastTickStartedAt + interval
		const nextByCooldown = lastTickFinishedAt + MIN_TICK_COOLDOWN_MS
		const nextTickAt = Math.max(nextByInterval, nextByCooldown)

		return Math.max(0, nextTickAt - Date.now())
	}

	/**
	 * Logs an info entry when the configured interval is shorter than the time needed to send all tick requests.
	 * @param {number} startedAt - Tick start timestamp in ms
	 * @param {number} finishedAt - Tick finish timestamp in ms
	 * @returns {void}
	 */
	function logIntervalWarningIfNeeded(startedAt, finishedAt) {
		const durationMs = finishedAt - startedAt
		const neededIntervalMs = durationMs + MIN_TICK_COOLDOWN_MS
		if (neededIntervalMs <= interval) return

		const suggestedIntervalSeconds = Math.ceil(neededIntervalMs / 1000)
		log.debug('Poll interval too short', {
			intervalSeconds: Math.ceil(interval / 1000),
			requestDurationSeconds: Math.ceil(durationMs / 1000),
			suggestion: `Increase poll interval to at least ${suggestedIntervalSeconds} seconds`,
		})
	}

	/**
	 * Starts the polling timer.
	 * @returns {void}
	 */
	function start() {
		if (!stopped) return

		stopped = false
		lastTickStartedAt = 0
		lastTickFinishedAt = 0
		log.debug(`Started with an interval of ${interval} ms`)
		poll()
	}

	/**
	 * Stops the polling timer and prevents pending ticks from scheduling again.
	 * @returns {void}
	 */
	function stop() {
		if (stopped) return

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
