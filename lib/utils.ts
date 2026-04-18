export const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const truncateEmail = (email: string | undefined, length: number = 20): string => {
  if (!email) return "";
  return email.length > length ? email.substring(0, length - 3) + "..." : email;
};
