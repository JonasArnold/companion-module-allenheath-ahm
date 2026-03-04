import type { TCPHelper } from '@companion-module/base'
import { EventEmitter } from 'eventemitter3'
import { prettyByte, prettyBytes } from '../../utils/pretty.js'
import { SocketReader } from '../../utils/socket-reader.js'

export interface MidiMessageEvents {
	/**
	 * MIDI channel messages starting with a byte with high bit set (but not
	 * equal to `0xF`, which denotes a system message) followed by a number of
	 * data bytes `0x00-0x7F` specified by the MIDI spec.
	 *
	 * Running statuses are silently normalized into non-running statuses.
	 */
	channel_message: [message: number[]]

	/**
	 * One-byte MIDI system real time messages, `0xF8-0xFF`.
	 */
	system_realtime: [message: number]

	/**
	 * MIDI system common messages starting with a byte `0xF1-0xF6` followed by
	 * a number of data bytes `0x00-0x7F` specified by the MIDI spec.
	 */
	system_common: [system_common_message: number[]]

	/**
	 * MIDI system exclusive messages starting with `0xF0` followed by zero or
	 * more data bytes `0x00-0x7F` terminated with `0xF7`.
	 *
	 * System exclusive messages that are terminated by a non-real time status
	 * other than `0xF7` are silently normalized to be terminated by `0xF7`.
	 */
	system_exclusive: [system_message: number[]]
}

/** A tokenizer of MIDI data that emits events for the MIDI messages read. */
export interface Tokenizer extends EventEmitter<MidiMessageEvents> {
	/** Run the tokenizer, resolving when there's no more data to tokenize. */
	run(): Promise<void>
}

/**
 * A MIDI channel message consisting of a byte in range `0x80-0xEF` and zero or
 * more data bytes in range `0x00-0x7F`.
 */
type ChannelMessage = {
	readonly type: 'channel'
	message: number[]
}

/**
 * A MIDI system real time message consisting of a single byte in the range
 * `0xF8-0xFF`.
 */
type SystemRealTimeMessage = {
	readonly type: 'system-real-time'
	message: number
}

/**
 * A MIDI system common message consisting of a byte in range `0xF1-0xF6` and
 * zero or more data bytes in range `0x00-0x7F`.
 */
type SystemCommonMessage = {
	readonly type: 'system-common'
	message: number[]
}

/**
 * A MIDI system exclusive message consisting of a byte in range `0xF0`, zero or
 * more data bytes in range `0x00-0x7F`, and a byte `0xF7`.
 */
type SystemExclusiveMessage = {
	readonly type: 'system-exclusive'
	message: number[]
}

/** All MIDI messages. */
export type MidiMessage = ChannelMessage | SystemRealTimeMessage | SystemCommonMessage | SystemExclusiveMessage

/**
 * A class for tokenizing incoming data to a socket as MIDI messages.  Attach
 * listeners for the various MIDI message types to `this` to handle tokens as
 * they're received.
 *
 * Note that tokenizing will silently normalize various MIDI edge cases: running
 * statuses will be exposed as non-running (i.e. every channel message will
 * always be prefixed by its status byte), and system exclusive messages
 * terminated not by `0xF7` but by some other status will be exposed as if they
 * were terminated by `0xF7`.
 */
export class MidiTokenizer extends EventEmitter<MidiMessageEvents> implements Tokenizer {
	#socket: TCPHelper
	#verboseLog: (msg: string) => void

	/**
	 * Create a MIDI tokenizer.
	 *
	 * @param socket
	 *   The socket to read from.
	 * @param verboseLog
	 *   A function that writes to the log only if verbose logging was enabled.
	 */
	constructor(socket: TCPHelper, verboseLog: (msg: string) => void) {
		super()
		this.#socket = socket
		this.#verboseLog = verboseLog
	}

	/**
	 * Run this tokenizer, returning a promise that settles once all MIDI tokens
	 * have been read.  (Because all MIDI byte sequences can be tokenized, this
	 * means no more bytes are available, i.e. the socket has closed.)
	 */
	async run(): Promise<void> {
		const socket = this.#socket
		const verboseLog = this.#verboseLog

		const receivedData: number[] = []

		const reader = await SocketReader.create(socket, receivedData)

		next_status: for (;;) {
			// Find the first status byte.
			let statusByte
			status_byte: for (;;) {
				for (let i = 0; i < receivedData.length; i++) {
					const b = receivedData[i]

					if (b < 0x80) {
						continue
					}

					if (0xf8 <= b) {
						console.log(`[TOKENIZER] system_realtime ${prettyByte(b)}`)
						this.emit('system_realtime', b)
						continue
					}

					statusByte = b
					receivedData.splice(0, i + 1)
					break status_byte
				}

				receivedData.length = 0
				const more = await reader.read()
				if (!more) {
					return
				}
			}

			const [highNibble, lowNibble] = [statusByte >> 4, statusByte & 0xf]

			let dataByteCount
			switch (highNibble) {
				case 0x8:
				case 0x9:
				case 0xa:
				case 0xb:
				case 0xe:
					dataByteCount = 2
					break

				case 0xc:
				case 0xd:
					dataByteCount = 1
					break

				default:
					throw new Error(`Unreachable: highNibble=${highNibble.toString(16)} should be a nibble with its high bit set`)

				case 0xf: {
					const systemMessage: number[] = [statusByte]

					switch (lowNibble) {
						case 0x0:
							for (;;) {
								for (let i = 0; i < receivedData.length; i++) {
									const b = receivedData[i]

									if (b < 0x80) {
										systemMessage.push(b)
										continue
									}

									if (0xf8 <= b) {
										console.log(`[TOKENIZER] system_realtime ${prettyByte(b)}`)
										this.emit('system_realtime', b)
										continue
									}

									receivedData.splice(0, i + 1)
									systemMessage.push(0xf7)
									console.log(`[TOKENIZER] system_exclusive ${prettyBytes(systemMessage)}`)
									this.emit('system_exclusive', systemMessage)
									continue next_status
								}

								receivedData.length = 0
								const more = await reader.read()
								if (!more) {
									return
								}
							}

						case 0x1:
						case 0x3:
							dataByteCount = 1
							break

						case 0x2:
							dataByteCount = 2
							break

						case 0x4:
						case 0x5:
							continue next_status

						case 0x6:
						case 0x7:
							dataByteCount = 0
							break

						default: {
							const msg =
								`Unreachable: lowNibble=${prettyByte(lowNibble)} ` +
								'should be limited to 0-7 because 0xf8-0xff were ' +
								'handled in the `status_byte` loop'
							throw new Error(msg)
						}
					}

					next_data_byte: while (systemMessage.length < 1 + dataByteCount) {
						for (let i = 0; i < receivedData.length; i++) {
							const b = receivedData[i]

							if (b < 0x80) {
								systemMessage.push(b)
								receivedData.splice(0, i + 1)
								continue next_data_byte
							}

							if (b < 0xf8) {
								receivedData.splice(0, i)
								verboseLog(`Discarding incomplete System Common message ${prettyBytes(systemMessage)}...`)
								continue next_status
							}

							this.emit('system_realtime', b)
							console.log(`[TOKENIZER] system_realtime ${prettyByte(b)}`)
						}

						receivedData.length = 0
						const more = await reader.read()
						if (!more) {
							return
						}
					}

					console.log(`[TOKENIZER] system_common ${prettyBytes(systemMessage)}`)
					this.emit('system_common', systemMessage)
					continue next_status
				}
			}

			for (;;) {
				const reply = [statusByte]

				next_data_byte: while (reply.length < 1 + dataByteCount) {
					for (let i = 0; i < receivedData.length; i++) {
						const b = receivedData[i]

						if (b < 0x80) {
							reply.push(b)
							receivedData.splice(0, i + 1)
							continue next_data_byte
						}

						if (b < 0xf8) {
							receivedData.splice(0, i)
							continue next_status
						}

						this.emit('system_realtime', b)
						console.log(`[TOKENIZER] system_realtime ${prettyByte(b)}`)
					}

					receivedData.length = 0
					const more = await reader.read()
					if (!more) {
						return
					}
				}

				console.log(`[TOKENIZER] channel_message ${prettyBytes(reply)}`)
				this.emit('channel_message', reply)
			}
		}
	}
}
