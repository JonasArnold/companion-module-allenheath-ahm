import { TCPHelper, InstanceStatus, InstanceBase } from '@companion-module/base'
import { parseResponse } from './parseResponse.js'
import { Priority } from '../utility/constants.js'
import { getContext } from '../context.js'

/**
 * TCP Client factory function. Creates TCP client and handles request queueing, sending, and receiving.
 * @param {Number} reqTime - Time between queued requests in ms
 * @returns {Function[]} Returns helper functions
 */
export function TCPClient(reqTime) {
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

		const { companion, state, poller } = getContext()

		midiSocket = new TCPHelper(host, port)

		midiSocket.on('status_change', (status, message) => {
			companion.updateStatus(status)
		})

		midiSocket.on('close', () => {
			if (onDisconnectCallback) {
				onDisconnectCallback()
			}
		})

		midiSocket.on('error', (err) => {
			companion.log('error', 'Error: ' + err.message)
			companion.updateStatus(InstanceStatus.ConnectionFailure)
		})

		midiSocket.on('data', (data) => {
			parseResponse(data)
		})

		midiSocket.on('connect', () => {
			companion.log('debug', `MIDI Connected to ${host}`)
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
		const { companion } = getContext()
		if ( !isConnected ) return

		// if queue is already running, let it be
		if (queueRunning) return
		queueRunning = true

		while (txQueue.length > 0) {
			const txBuffer = txQueue.shift()
			if (!txBuffer) continue

			try {
				send(txBuffer.buffers)
			} catch (e) {
				companion.log('error', 'Buffer sending error: ' + e)
			}

			await new Promise((resolve) => {
				cancelSleep = resolve
				setTimeout(resolve, reqTime)
			})
			cancelSleep = null
		}

		queueRunning = false
	}

	function send(buffers) {
		const { companion } = getContext()
		if ( !isConnected ) return

		if (buffers.length !== 0) {
			for (let i = 0; i < buffers.length; i++) {
				if (!midiSocket) return
				companion.log('debug', `sending ${buffers[i].toString('hex')} via MIDI TCP`)
				midiSocket.send(buffers[i])
				companion.log('debug', `2. Sending at: ${Date.now()} -- ${buffers[i].toString('hex')}`)
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
