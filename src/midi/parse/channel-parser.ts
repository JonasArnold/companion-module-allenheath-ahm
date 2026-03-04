import { manyPrettyBytes, prettyBytes } from '../../utils/pretty.js'
import { EventEmitter } from 'eventemitter3'

export interface ChannelParserEvents {
	input_mute: [channel: number, muted: boolean]
	zone_mute: [channel: number, muted: boolean]
	controlgroup_mute: [channel: number, muted: boolean]
	send_mute: [input: number, zone: number, muted: boolean]
	level_changed: [channelType: number, channel: number, level: number]
}

export class ChannelParser extends EventEmitter<ChannelParserEvents> {
	#gen: Generator<void, void, number[]>
	#verboseLog: (msg: string) => void

	constructor(verboseLog: (msg: string) => void) {
		super()
		this.#verboseLog = verboseLog
		this.#gen = this.#parseMessages(verboseLog)
		this.#gen.next()
	}

	handleMessage(message: number[]): void {
		this.#gen.next(message)
	}

	handleSystemExclusive(message: number[]): void {
		if (message.length < 14) {
			return
		}

		// Only parse the specific AHM "Input->Zone mute state" SysEx reply.
		// Header: F0 00 00 1A 50 12 01 00
		// Payload pattern (observed from existing module logic):
		// [8]=chType(0=input), [9]=0x01, [10]=input, [11]=sendChType(1=zone), [12]=zone, [13]=mute(0x3f/0x7f)
		if (
			message[0] !== 0xf0 ||
			message[1] !== 0x00 ||
			message[2] !== 0x00 ||
			message[3] !== 0x1a ||
			message[4] !== 0x50 ||
			message[5] !== 0x12 ||
			message[6] !== 0x01 ||
			message[7] !== 0x00 ||
			message[8] !== 0x00 ||
			message[9] !== 0x01 ||
			message[11] !== 0x01
		) {
			return
		}

		const muteByte = message[13]
		if (muteByte !== 0x3f && muteByte !== 0x7f) {
			return
		}

		const input = message[10] + 1
		const zone = message[12] + 1
		const muted = muteByte === 0x7f
		this.#verboseLog(`[PARSE] send_mute input=${input} zone=${zone} muted=${muted}`)
		this.emit('send_mute', input, zone, muted)
	}

	*#parseMessages(verboseLog: (msg: string) => void): Generator<void, void, number[]> {
		read_message: for (;;) {
			const first = yield

			if (first.length < 1) {
				continue read_message
			}

			const status = first[0]

			if (status === 0x90 || status === 0x91 || status === 0x92) {
				if (first.length < 3) {
					verboseLog(`Malformed mute message ${prettyBytes(first)}, ignoring`)
					continue read_message
				}

				const channel = first[1]
				const muteByte = first[2]
				if (muteByte !== 0x3f && muteByte !== 0x7f) {
					// Ignore non-state NOTE values (eg note-off style echoes).
					continue read_message
				}
				const muted = muteByte === 0x7f

				switch (status) {
					case 0x90:
						verboseLog(`[PARSE] input_mute channel=${channel + 1} muted=${muted}`)
						this.emit('input_mute', channel, muted)
						break
					case 0x91:
						verboseLog(`[PARSE] zone_mute channel=${channel + 1} muted=${muted}`)
						this.emit('zone_mute', channel, muted)
						break
					case 0x92:
						verboseLog(`[PARSE] controlgroup_mute channel=${channel + 1} muted=${muted}`)
						this.emit('controlgroup_mute', channel, muted)
						break
				}
				continue read_message
			}

			if (status === 0xb0 || status === 0xb1 || status === 0xb2) {
				const channelType = status - 0xb0

				// Legacy direct packed form (kept as fallback).
				if (first.length >= 7) {
					const channel = first[2] + 1
					const level = first[6]
					verboseLog(`[PARSE] level_changed type=${channelType} channel=${channel} level=${level}`)
					this.emit('level_changed', channelType, channel, level)
					continue read_message
				}

				// AHM NRPN-like form:
				// [Bn 63 CH] [Bn 62 17] [Bn 06 LV]
				if (first.length === 3 && first[1] === 0x63) {
					const second = yield
					if ((second[0] & 0xf0) !== 0xb0 || second[1] !== 0x62 || second[2] !== 0x17) {
						verboseLog(`Malformed level message ${manyPrettyBytes(first, second)}, ignoring`)
						continue read_message
					}

					const third = yield
					if ((third[0] & 0xf0) !== 0xb0 || third[1] !== 0x06) {
						verboseLog(`Malformed level message ${manyPrettyBytes(first, second, third)}, ignoring`)
						continue read_message
					}

					const channel = first[2] + 1
					const level = third[2]
					verboseLog(`[PARSE] level_changed type=${channelType} channel=${channel} level=${level}`)
					this.emit('level_changed', channelType, channel, level)
					continue read_message
				}

				if (first.length === 3 && first[1] === 0x06) {
					// Value-only fragments without preceding NRPN selector appear sometimes.
					// Ignore to avoid noisy "Malformed level message" spam.
					continue read_message
				}

				if (first.length === 3 && first[1] === 0x62) {
					continue read_message
				}

				if (first.length === 3 && first[1] === 0x26) {
					continue read_message
				}

				verboseLog(`Malformed level message ${prettyBytes(first)}, ignoring`)
				continue read_message
			}

			verboseLog(`Unrecognized channel message, ignoring: ${manyPrettyBytes(first)}`)
		}
	}
}
