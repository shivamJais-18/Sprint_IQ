import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

const toId = (value) => {
  if (!value) return null;
  const raw = value?._id ?? value;
  const id = raw?.toString?.() ?? null;
  return id && mongoose.Types.ObjectId.isValid(id) ? id : null;
};

// Creates one notification per unique recipient. Notification failures are logged
// but never break the main request that triggered the notification.
export const notifyUsers = async (recipients, {
  type,
  title,
  message,
  relatedId,
  excludeUserId
}) => {
  try {
    const excludeId = toId(excludeUserId);
    const uniqueIds = [...new Set(
      (recipients || [])
        .map(toId)
        .filter(Boolean)
        .filter((id) => id !== excludeId)
    )];

    if (!uniqueIds.length) return { created: 0 };

    const created = await Notification.insertMany(
      uniqueIds.map((recipient) => ({
        recipient,
        type,
        title,
        message,
        relatedId
      }))
    );

    console.log(`Notifications created: ${created.length}`);
    return { created: created.length };
  } catch (error) {
    console.error('Notification error:', error.message);
    return { created: 0, error: error.message };
  }
};
