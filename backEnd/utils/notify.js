import Notification from '../models/Notification.js';

const toId = (value) => (value ? value.toString() : null);

// Creates one notification per unique recipient. Never throws - a
// notification failure should never break the request that triggered it.
export const notifyUsers = async (recipients, { type, title, message, relatedId, excludeUserId }) => {
  try {
    const excludeId = toId(excludeUserId);
    const uniqueIds = [...new Set(
      (recipients || [])
        .map(toId)
        .filter(Boolean)
        .filter((id) => id !== excludeId)
    )];

    if (!uniqueIds.length) return;

    await Notification.insertMany(
      uniqueIds.map((recipient) => ({
        recipient,
        type,
        title,
        message,
        relatedId
      }))
    );
  } catch (error) {
    console.error('Notification error:', error);
  }
};
