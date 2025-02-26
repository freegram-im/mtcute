export function decodeWaveform(wf: Buffer): number[] {
    const bitsCount = wf.length * 8
    const valuesCount = ~~(bitsCount / 5)

    if (!valuesCount) return []

    const lastIdx = valuesCount - 1

    // Read each 5 bit of encoded5bit as 0-31 unsigned char.
    // We count the index of the byte in which the desired 5-bit sequence starts.
    // And then we read a uint16 starting from that byte to guarantee to get all of those 5 bits.
    //
    // BUT! if it is the last byte we have, we're not allowed to read a uint16 starting with it.
    // Because it will be an overflow (we'll access one byte after the available memory).
    // We see, that only the last 5 bits could start in the last available byte and be problematic.
    // So we read in a general way all the entries except the last one.

    const result: number[] = []
    for (let i = 0, j = 0; i < lastIdx; i++, j += 5) {
        const byteIdx = ~~(j / 8)
        const bitShift = j % 8
        result[i] = (wf.readUInt16LE(byteIdx) >> bitShift) & 0b11111
    }

    const lastByteIdx = ~~((lastIdx * 5) / 8)
    const lastBitShift = (lastIdx * 5) % 8
    const lastValue =
        lastByteIdx === wf.length - 1
            ? wf[lastByteIdx]
            : wf.readUInt16LE(lastByteIdx)
    result[lastIdx] = (lastValue >> lastBitShift) & 0b11111

    return result
}


export function encodeWaveform(wf: number[]): Buffer {
    const bitsCount = wf.length * 5
    const bytesCount = ~~(bitsCount + 7) / 8
    const result = Buffer.alloc(bytesCount + 1)

    // Write each 0-31 unsigned char as 5 bit to result.
    // We reserve one extra byte to be able to dereference any of required bytes
    // as a uint16 without overflowing, even the byte with index "bytesCount - 1".

    for (let i = 0, j = 0; i < wf.length; i++, j += 5) {
        const byteIdx = ~~(j / 8)
        const bitShift = j % 8
        const value = (wf[i] & 0b11111) << bitShift

        const old = result.readUInt16LE(byteIdx)
        result.writeUInt16LE(old | value, byteIdx)
    }

    return result.slice(0, bytesCount)
}
