import { TCPHelper, InstanceStatus } from '@companion-module/base'
import { parseResponse } from './parseResponse.js'
import { Priority } from '../utility/constants.js'
import { getContext } from '../context.js'
import { createLogger, formatHex } from '../utility/log.js'

const log = createLogger('TCP')
const ENABLE_TCP_LOGGING = false
const TIME_BETW_MULTIPLE_REQ_MS = 150

/**
 * TCP Client factory function. Creates TCP client and handles request queueing, sending, and receiving.
 * @returns {Function[]} Returns helper functions
 */
export function TCPClient() {
	let midiSocket
	let txQueue = []
	let queueRunning = false
	let isConnected = false
	let onConnectedCallback
	let onDisconnectCallback
	let pollHoldUntil = 0
	let cancelSleep = null

	function destroy() {
		if (!midiSocket) return

		midiSocket.destroy()
		midiSocket = undefined
		isConnected = false
	}

	function init(host, port) {
		destroy()

		if (!host || !port) return

		const { companion } = getContext()

		midiSocket = new TCPHelper(host, port)

		midiSocket.on('status_change', (status, message) => {
			log.debug('StatusChanged', { status, message: message ?? '' })
			companion.updateStatus(status)
		})

		midiSocket.on('close', () => {
			isConnected = false
			log.info('Disconnected', { host, port })
			if (onDisconnectCallback) {
				onDisconnectCallback()
			}
		})

		midiSocket.on('error', (err) => {
			log.error('SocketError', { message: err.message })
			companion.updateStatus(InstanceStatus.ConnectionFailure)
		})

		midiSocket.on('data', (data) => {
			if (ENABLE_TCP_LOGGING) console.log(`[AHM][TCP][Raw] Received Hex=${formatHex(data)}`)
			parseResponse(data)
		})

		midiSocket.on('connect', () => {
			log.info('Connected', { host, port })
			companion.updateStatus(InstanceStatus.Ok)
			isConnected = true

			if (onConnectedCallback) {
				onConnectedCallback()
			}
		})
	}

	function onConnected(cb) {
		onConnectedCallback = cb
	}

	function onDisconnect(cb) {
		onDisconnectCallback = cb
	}

	function holdPolling(ms) {
		pollHoldUntil = Math.max(pollHoldUntil, Date.now() + ms)
	}

	/**
	 * Queues MIDI packet for sending
	 * @param {Buffer} buffers
	 * @param {Priority} priority - defaults to high unless specified
	 */
	function queue(buffers, priority = Priority.HIGH) {
		if (priority === Priority.HIGH) {
			txQueue.unshift({ buffers, priority, timestamp: Date.now() })
			holdPolling(200)
			if (cancelSleep) {
				cancelSleep()
				cancelSleep = null
			}
		} else {
			txQueue.push({ buffers, priority, timestamp: Date.now() })
		}
		startQueue()
	}

	async function startQueue() {
		if (!isConnected) return

		// if queue is already running, let it be
		if (queueRunning) return
		queueRunning = true

		while (txQueue.length > 0) {
			const txBuffer = txQueue.shift()
			if (!txBuffer) continue

			try {
				send(txBuffer.buffers)
			} catch (e) {
				log.error('SendFailed', { message: e.message ?? e })
			}
			if (ENABLE_TCP_LOGGING) console.log(`[AHM][TCP][Queue] Progress remaining=${txQueue.length}`)

			await new Promise((resolve) => {
				cancelSleep = resolve
				setTimeout(resolve, TIME_BETW_MULTIPLE_REQ_MS)
			})
			cancelSleep = null
		}

		queueRunning = false
	}

	function send(buffers) {
		if (!isConnected) return

		if (buffers.length !== 0) {
			for (let i = 0; i < buffers.length; i++) {
				if (!midiSocket) return
				if (ENABLE_TCP_LOGGING) console.log(`[AHM][TCP][Raw] Sent Hex=${formatHex(buffers[i])}`)
				midiSocket.send(buffers[i])
			}
		}
	}

	return {
		destroy,
		init,
		queue,
		isConnected,
		onConnected,
		onDisconnect,
	}
}
