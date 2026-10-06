/// Canonical Socket.IO event names (must match the backend contract exactly).
/// See launch-readiness/API_DOCUMENTATION.md §7.
abstract class SocketEvents {
  // Connection
  static const ready = 'ready';
  static const presence = 'presence';

  // Inbound → server
  static const chatSend = 'chat:send';
  static const chatTyping = 'chat:typing';
  static const chatRead = 'chat:read';
  static const sosTrigger = 'sos:trigger';
  static const locationUpdate = 'location:update';
  static const batteryUpdate = 'battery:update';
  static const requestDecide = 'request:decide';

  // Outbound ← server
  static const chatMessage = 'chat:message';
  static const chatStatus = 'chat:status';
  static const notificationNew = 'notification:new';
  static const notificationRead = 'notification:read';
  static const notificationReadAll = 'notification:read-all';
  static const taskUpserted = 'task:upserted';
  static const taskDeleted = 'task:deleted';
  static const taskComment = 'task:comment';
  static const taskProof = 'task:proof';
  static const recurringUpserted = 'recurring:upserted';
  static const recurringDeleted = 'recurring:deleted';
  static const categoryUpserted = 'category:upserted';
  static const rewardUpserted = 'reward:upserted';
  static const rewardDeleted = 'reward:deleted';
  static const targetUpserted = 'target:upserted';
  static const targetDeleted = 'target:deleted';
  static const achievementUnlocked = 'achievement:unlocked';
  static const streakUpdated = 'streak:updated';
  static const reportReady = 'report:ready';
  static const sosAlert = 'sos:alert';
  static const sosResolved = 'sos:resolved';
  static const zonesUpdate = 'zones:update';
  static const zoneEvent = 'zone:event';
  static const radarEvent = 'radar:event';
  static const supportTicketNew = 'support:ticket-new';
  static const supportTicketUpdate = 'support:ticket-update';
  static const supportTicketComment = 'support:ticket-comment';
  static const featureNew = 'feature:new';
  static const featureUpdate = 'feature:update';
  static const announcementNew = 'announcement:new';
  static const changelogNew = 'changelog:new';
}
