interface TwoWayLinkedList<K, T> {
    // k = key
    k: K
    // v = value
    v: T
    // p = previous
    p?: TwoWayLinkedList<K, T>
    // n = next
    n?: TwoWayLinkedList<K, T>
}

/**
 * Simple class implementing LRU-like behaviour for a map,
 * falling back to objects when `Map` is not available.
 *
 * Can be used to handle local cache of *something*
 *
 * Uses two-way linked list internally to keep track of insertion/access order
 */
export class LruMap<K extends keyof any, V> {
    private _capacity: number
    private _first?: TwoWayLinkedList<K, V>
    private _last?: TwoWayLinkedList<K, V>

    private _size = 0

    constructor(capacity: number, useObject = false) {
        this._capacity = capacity

        if (typeof Map === 'undefined' || useObject) {
            const obj = {} as any
            this._set = (k, v) => (obj[k] = v)
            this._has = (k) => k in obj
            this._get = (k) => obj[k]
            this._del = (k) => delete obj[k]
        } else {
            const map = new Map()
            this._set = map.set.bind(map)
            this._has = map.has.bind(map)
            this._get = map.get.bind(map)
            this._del = map.delete.bind(map)
        }
    }

    private readonly _set: (key: K, value: V) => void
    private readonly _has: (key: K) => boolean
    private readonly _get: (key: K) => TwoWayLinkedList<K, V> | undefined
    private readonly _del: (key: K) => void

    private _markUsed(item: TwoWayLinkedList<K, V>): void {
        if (item === this._first) {
            return // already the most recently used
        }

        if (item.p) {
            if (item === this._last) {
                this._last = item.p
            }
            item.p.n = item.n
        }

        if (item.n) {
            item.n.p = item.p
        }

        item.p = undefined
        item.n = this._first
        if (this._first) {
            this._first.p = item
        }
        this._first = item
    }

    get(key: K): V | undefined {
        const item = this._get(key)
        if (!item) return undefined

        this._markUsed(item)
        return item.v
    }

    has(key: K): boolean {
        return this._has(key)
    }

    set(key: K, value: V): void {
        let item = this._get(key)

        if (item) {
            // already in cache, update
            item.v = value
            this._markUsed(item)
            return
        }

        item = {
            k: key,
            v: value,
        }
        this._set(key, item as any)

        if (this._first) {
            this._first.p = item
            item.n = this._first
        } else {
            // first item ever
            this._last = item
        }

        this._first = item
        this._size += 1
        if (this._size > this._capacity) {
            // remove the last item
            const oldest = this._last
            if (oldest) {
                if (oldest.p) {
                    this._last = oldest.p
                    this._last!.n = undefined
                } else {
                    // exhausted
                    this._last = undefined
                    this._first = undefined
                }

                // remove strong refs to and from the item
                oldest.p = oldest.n = undefined
                this._del(oldest.k)
                this._size -= 1
            }
        }
    }

    delete(key: K): void {
        this._del(key)
    }
}
