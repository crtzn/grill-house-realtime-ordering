export const handleLogOut = () => {
  // Clear cookies or session storage
  document.cookie =
    "authenticated=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "userRole=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

  // Redirect to login page
  window.location.href = "/login"; // Force a full page reload to clear state
};
