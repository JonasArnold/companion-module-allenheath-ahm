import type { ChannelParser } from './channel-parser.js'
import { prettyByte, prettyBytes } from '../../utils/pretty.js'
import type { Tokenizer } from '../tokenize/tokenizer.js'

/**
 * Given a MIDI tokenizer, run it until tokenizing completes, forwarding all
 * tokenized channel and system exclusive MIDI messages to `channelParser`.
 */
export async function parseMidi(
	verboseLog: (msg: string) => void,
	tokenizer: Tokenizer,
	channelParser: ChannelParser,
): Promise<void> {
	tokenizer.on('channel_message', (message: number[]) => {
		channelParser.handleMessage(message)
	})
	tokenizer.on('system_common', (message: number[]) => {
		verboseLog(`Discarding system common message ${prettyBytes(message)}`)
	})
	tokenizer.on('system_realtime', (b: number) => {
		verboseLog(`Discarding system real time message ${prettyByte(b)}`)
	})
	tokenizer.on('system_exclusive', (message: number[]) => {
		channelParser.handleSystemExclusive(message)
	})

	return tokenizer.run()
}
