export function getUserAvatarInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function isAvatarImageSource(avatar?: string | null) {
  if (!avatar) {
    return false;
  }

  const normalizedAvatar = avatar.trim().toLowerCase();

  return (
    normalizedAvatar.startsWith("/") ||
    normalizedAvatar.startsWith("blob:") ||
    normalizedAvatar.startsWith("data:image/") ||
    normalizedAvatar.startsWith("http://") ||
    normalizedAvatar.startsWith("https://")
  );
}

export function getAvatarFallbackLabel(fullName: string, avatar?: string | null) {
  if (avatar && !isAvatarImageSource(avatar)) {
    return avatar.trim().slice(0, 3).toUpperCase();
  }

  return getUserAvatarInitials(fullName);
}
