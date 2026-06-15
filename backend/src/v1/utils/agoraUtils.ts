/**
 * Converts a standard UUID to an Agora-compatible User ID (lowercase alphanumeric).
 * Agora Chat rejects hyphens in some SDK versions/REST API calls.
 */
export const toAgoraUserId = (uuid: string): string => {
  return uuid.replace(/-/g, '').toLowerCase();
};

/**
 * Converts an Agora User ID back to a standard UUID format.
 * (8-4-4-4-12 format)
 */
export const toStandardUuid = (agoraId: string): string => {
  if (agoraId.length === 32) {
    return `${agoraId.slice(0, 8)}-${agoraId.slice(8, 12)}-${agoraId.slice(12, 16)}-${agoraId.slice(16, 20)}-${agoraId.slice(20)}`;
  }
  return agoraId;
};
