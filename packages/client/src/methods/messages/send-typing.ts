import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { InputPeerLike, TypingStatus } from '../../types'

/**
 * Sends a current user/bot typing event
 * to a conversation partner or group.
 *
 * This status is set for 6 seconds, and is
 * automatically cancelled if you send a
 * message.
 *
 * @param chatId  Chat ID
 * @param status  Typing status
 * @param params
 * @internal
 */
export async function sendTyping(
    this: TelegramClient,
    chatId: InputPeerLike,
    status: TypingStatus | tl.TypeSendMessageAction = 'typing',
    params?: {
        /**
         * For `upload_*` and history import actions, progress of the upload
         */
        progress?: number

        /**
         * For comment threads, ID of the thread (i.e. top message)
         */
        threadId?: number
    }
): Promise<void> {
    if (typeof status === 'string') {
        const progress = params?.progress ?? 0
        switch (status) {
            case 'typing':
                status = { _: 'sendMessageTypingAction' }
                break
            case 'cancel':
                status = { _: 'sendMessageCancelAction' }
                break
            case 'record_video':
                status = { _: 'sendMessageRecordVideoAction' }
                break
            case 'upload_video':
                status = { _: 'sendMessageUploadVideoAction', progress }
                break
            case 'record_voice':
                status = { _: 'sendMessageRecordAudioAction' }
                break
            case 'upload_voice':
                status = { _: 'sendMessageUploadAudioAction', progress }
                break
            case 'upload_photo':
                status = { _: 'sendMessageUploadPhotoAction', progress }
                break
            case 'upload_document':
                status = { _: 'sendMessageUploadDocumentAction', progress }
                break
            case 'geo':
                status = { _: 'sendMessageGeoLocationAction' }
                break
            case 'contact':
                status = { _: 'sendMessageChooseContactAction' }
                break
            case 'game':
                status = { _: 'sendMessageGamePlayAction' }
                break
            case 'record_round':
                status = { _: 'sendMessageRecordRoundAction' }
                break
            case 'upload_round':
                status = { _: 'sendMessageUploadRoundAction', progress }
                break
            case 'speak_call':
                status = { _: 'speakingInGroupCallAction' }
                break
            case 'history_import':
                status = { _: 'sendMessageHistoryImportAction', progress }
                break
        }
    }

    await this.call({
        _: 'messages.setTyping',
        peer: await this.resolvePeer(chatId),
        action: status,
        topMsgId: params?.threadId,
    })
}
