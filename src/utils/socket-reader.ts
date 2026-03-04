import { type TCPHelper } from '@companion-module/base'

/** A class to read bytes from a socket and append them to a provided array. */
export class SocketReader {
	readonly #gen: AsyncGenerator<void, void, void>

	static async create(source: TCPHelper, out: number[], verboseLog: (msg: string) => void): Promise<SocketReader> {
		const reader = new SocketReader(source, out, verboseLog)
		await reader.#gen.next()
		return reader
	}

	async read(): Promise<boolean> {
		const done = Boolean((await this.#gen.next()).done)
		return !done
	}

	private constructor(source: TCPHelper, data: number[], verboseLog: (msg: string) => void) {
		this.#gen = SocketReader.#createReader(source, data, verboseLog)
	}

	static async *#createReader(
		source: TCPHelper,
		receivedData: number[],
		verboseLog: (msg: string) => void,
	): AsyncGenerator<void, void, void> {
		const socketClosed = new Promise<boolean>((resolve: (more: boolean) => void, _reject: (reason: Error) => void) => {
			const stop = () => {
				resolve(false)
			}
			source.once('end', stop)
			source.once('error', stop)
		})

		let dataAvailable = (async function readMore() {
			return new Promise<boolean>((resolve: (more: boolean) => void) => {
				source.once('data', (data: Buffer) => {
					verboseLog(`[TCP IN] ${data.toString('hex')}`)
					for (const b of data) receivedData.push(b)
					resolve(true)
					dataAvailable = readMore()
				})
			})
		})()

		for (;;) {
			const keepGoing = await Promise.race([socketClosed, dataAvailable])
			if (!keepGoing) {
				break
			}
			yield
		}
	}
}
