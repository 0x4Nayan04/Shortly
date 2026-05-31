import short_urlModel from '../schema/shortUrl.model.js';
import { SLUG_RECLAIM_DAYS } from '../constants/shortUrlLimits.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';

export const saveShortUrl = async ({
  short_url,
  full_url,
  canonical_url,
  user_Id,
  manage_token = null
}) => {
  const slug = normalizeSlug(short_url);
  const doc = {
    full_url,
    canonical_url,
    short_url: slug,
    click: 0,
    disabled: false,
    deletedAt: null
  };

  if (user_Id) {
    doc.user = user_Id;
  }

  if (manage_token) {
    doc.manage_token = manage_token;
  }

  const created = await short_urlModel.create(doc);
  return { short_url: slug, id: created._id.toString() };
};

export const isSlugAvailable = async (short_url) => {
  const slug = normalizeSlug(short_url);
  const existing = await short_urlModel
    .findOne({ short_url: slug })
    .select('deletedAt')
    .lean();

  if (!existing) return true;
  if (!existing.deletedAt) return false;

  const reclaimMs = SLUG_RECLAIM_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(existing.deletedAt).getTime() >= reclaimMs;
};

export const purgeReclaimableSlug = async (short_url) => {
  const slug = normalizeSlug(short_url);
  const existing = await short_urlModel
    .findOne({ short_url: slug })
    .select('deletedAt')
    .lean();

  if (!existing?.deletedAt) return;

  const reclaimMs = SLUG_RECLAIM_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - new Date(existing.deletedAt).getTime() < reclaimMs) {
    return;
  }

  await short_urlModel.deleteOne({ _id: existing._id });
};

export const countActiveLinksForUser = async (userId) =>
  short_urlModel.countDocuments({ user: userId, deletedAt: null });
