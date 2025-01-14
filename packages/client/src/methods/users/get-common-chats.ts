import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { TelegramClient } from '../../client'
import { Chat } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/**
 * Get a list of common chats you have with a given user
 *
 * @param userId  User's ID, username or phone number
 * @throws MtInvalidPeerTypeError
 * @internal
 */
export async function getCommonChats(
    this: TelegramClient,
    userId: InputPeerLike
): Promise<Chat[]> {
    const peer = normalizeToInputUser(await this.resolvePeer(userId))
    if (!peer) throw new MtInvalidPeerTypeError(userId, 'user')

    return this.call({
        _: 'messages.getCommonChats',
        userId: peer,
        maxId: 0,
        limit: 100,
    }).then((res) => res.chats.map((it) => new Chat(this, it)))
}
