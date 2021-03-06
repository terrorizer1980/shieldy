import { deleteMessageSafeWithBot } from '@helpers/deleteMessageSafe'
import { bot } from '@helpers/bot'
import { Chat, Candidate } from '@models/Chat'
import { report } from '@helpers/report'
import { addKickedUser } from '@helpers/newcomers/addKickedUser'
import { modifyCandidates } from '@helpers/candidates'
import { modifyRestrictedUsers } from '@helpers/restrictedUsers'

export async function kickCandidates(chat: Chat, candidates: Candidate[]) {
  // Loop through candidates
  for (const candidate of candidates) {
    // Try kicking the candidate
    try {
      addKickedUser(chat, candidate.id)
      kickChatMemberProxy(
        chat.id,
        candidate.id,
        chat.banUsers ? 0 : parseInt(`${new Date().getTime() / 1000 + 45}`)
      )
    } catch (err) {
      report(err)
    }
    // Try deleting their entry messages
    if (chat.deleteEntryOnKick) {
      deleteMessageSafeWithBot(candidate.entryChatId, candidate.entryMessageId)
      deleteMessageSafeWithBot(candidate.entryChatId, candidate.leaveMessageId)
    }
    // Try deleting the captcha message
    deleteMessageSafeWithBot(chat.id, candidate.messageId)
  }
  // Remove from candidates
  await modifyCandidates(chat, false, candidates)
  // Remove from restricted
  await modifyRestrictedUsers(chat, false, candidates)
}

async function kickChatMemberProxy(
  id: number,
  candidateId: number,
  duration: number
) {
  try {
    await bot.telegram.kickChatMember(id, candidateId, duration)
  } catch (err) {
    report(err)
  }
}
