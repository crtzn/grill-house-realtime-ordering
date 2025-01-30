// utils/getUserRole.ts
export const getUserRole = (): string | null => {
  if (typeof window === "undefined") return null; // Ensure this runs on the client side
  const role = document.cookie
    .split("; ")
    .find((row) => row.startsWith("userRole="))
    ?.split("=")[1];
  return role || null;
};
