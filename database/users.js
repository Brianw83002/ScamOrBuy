// Users: in-memory list of logged-in users, decoded from the Google ID token.
// NOTE: resets on every page load since there's no backend or localStorage.

const USERS = [];
let currentUser = null;

function addUser(user) {
  const existing = USERS.find((u) => u.sub === user.sub);
  if (existing) {
    Object.assign(existing, user);
  } else {
    USERS.push(user);
  }
  currentUser = user;
}

function getCurrentUser() {
  return currentUser;
}

function clearCurrentUser() {
  currentUser = null;
}

// Decodes the payload of a Google ID token (JWT) without verifying the
// signature. Fine for reading name/email client-side in a school project;
// never trust this for real auth decisions without server-side verification.
function decodeGoogleCredential(credential) {
  const payload = credential.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
  return JSON.parse(json);
}