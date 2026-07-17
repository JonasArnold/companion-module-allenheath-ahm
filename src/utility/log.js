import { getContext } from '../context.js'

function formatValues(values) {
	return Object.entries(values)
		.map(([name, value]) => `${name}=${value}`)
		.join(' ')
}

export function formatHex(data) {
	const buffers = Array.isArray(data) ? data : [data]
	return buffers
		.map(
			(buffer) =>
				buffer
					.toString('hex')
					.match(/.{1,2}/g)
					?.join(' ') ?? '',
		)
		.join(' | ')
}

/**
 * Creates a Companion logger with a fixed [AHM][Scope] prefix.
 * @param {String} scope - Short PascalCase logging scope
 * @returns {Object} Scoped debug, info, warn, and error methods
 */
export function createLogger(scope) {
	function write(level, event, values = {}, data) {
		const variables = formatValues(values)
		const valuesText = variables ? ` ${variables}` : ''
		const hexText = data ? ` Hex=${formatHex(data)}` : ''
		getContext().companion.log(level, `[AHM][${scope}] ${event}${valuesText}${hexText}`)
	}

	return {
		debug: (event, values, data) => write('debug', event, values, data),
		info: (event, values, data) => write('info', event, values, data),
		warn: (event, values, data) => write('warn', event, values, data),
		error: (event, values, data) => write('error', event, values, data),
	}
}
