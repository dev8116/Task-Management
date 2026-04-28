const ActivityLog = require("../models/ActivityLog");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Log activity and create notifications.
 * @param {Object} opts
 * @param {ObjectId} opts.actor - user performing the action
 * @param {String} opts.actorRole - role of actor
 * @param {String} opts.action - code string e.g. "CHECK_IN"
 * @param {String} opts.title - short title for notification
 * @param {String} opts.description - human readable description
 * @param {String} opts.entity - domain e.g. "Attendance"
 * @param {ObjectId} opts.entityId - optional target id
 * @param {ObjectId[]} opts.recipients - user ids to notify
 * @param {ObjectId} [opts.relatedUser] - optional target user
 */
async function notify(opts) {
  const {
    actor,
    actorRole,
    action,
    title,
    description,
    entity,
    entityId,
    recipients = [],
    relatedUser = null,
  } = opts;

  // store one ActivityLog per actor (for auditing)
  try {
    await ActivityLog.create({
      user: actor,
      role: actorRole,
      action,
      description,
      entity,
      entityId,
      relatedUser,
    });
  } catch (err) {
    console.error("ActivityLog error:", err.message);
  }

  // fan-out notifications per recipient
  if (!recipients.length) return;

  const docs = recipients.map((uid) => ({
    user: uid,
    actor,
    role: actorRole,
    action,
    title,
    description,
    entity,
    entityId,
  }));

  try {
    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
}

/**
 * Utility to find admin and manager recipients for a given user/team.
 * @param {Object} actorUserDoc - Mongoose user doc of actor (should include role, manager references if any)
 * @param {ObjectId[]} extraIds - additional user ids to notify (e.g., task assignees)
 * @returns {Promise<ObjectId[]>}
 */
async function getRecipients(actorUserDoc, extraIds = []) {
  const ids = new Set(extraIds.map(String));

  // Admins
  const admins = await User.find({ role: "admin" }, "_id").lean();
  admins.forEach((a) => ids.add(String(a._id)));

  // Managers (simplified: notify all managers; customize per team if you have team references)
  const managers = await User.find({ role: "manager" }, "_id").lean();
  managers.forEach((m) => ids.add(String(m._id)));

  // Remove actor themselves only if not desired for certain actions; keep by default
  // ids.delete(String(actorUserDoc._id));

  return Array.from(ids).map((s) => s);
}

module.exports = { notify, getRecipients };