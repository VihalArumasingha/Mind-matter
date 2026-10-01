import {countPendingOrganizerNotifications} from '../src/features/organizer/services/organizerNotificationService'

describe('countPendingOrganizerNotifications', () => {
  it('counts active organizer attention items', () => {
    const notifications = [
      {type: 'MEMBER_REQUEST', isRead: false},
      {type: 'POST_MODERATION', isRead: false},
      {type: 'SESSION_REGISTRATION', isRead: true},
      {type: 'MEMBER_REQUEST', isRead: true},
    ]

    expect(countPendingOrganizerNotifications(notifications)).toBe(2)
  })

  it('returns zero when there are no pending items', () => {
    expect(countPendingOrganizerNotifications([])).toBe(0)
    expect(countPendingOrganizerNotifications(null)).toBe(0)
  })
})
