// Singleton context object
let _tcpClient = null
let _state = null
let _companion = null
let _poller = null

export function initContext({ tcpClient, state, companion, poller }) {
	_tcpClient = tcpClient
	_state = state
	_companion = companion
	_poller = poller
}

export function getContext() {
	return {
		tcpClient: _tcpClient,
		state: _state,
		companion: _companion,
		poller: _poller,
	}
}
