// Profile page: reads the votes saved by the Rate page and lists them.
// LISTINGS and STORAGE_KEY come from listings.js.
// USERS, getCurrentUser, addUser, clearCurrentUser, decodeGoogleCredential come from users.js.

function loadRatings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function saveRatings(ratings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  } catch (err) {
    // Storage unavailable: changes last until the page is closed.
  }
}

const $ = (id) => document.getElementById(id);
const list = $("vote-list");
const filterButtons = document.querySelectorAll("[data-filter]");

let ratings = loadRatings();
let filter = "all";

// The side the community picked, before this user's vote.
function crowdSide(listing) {
  return listing.worth >= listing.scam ? "worth" : "scam";
}

function rated() {
  return LISTINGS.filter((listing) => ratings[listing.id]);
}

function label(choice) {
  return choice === "worth" ? "Worth it" : "Scam";
}

function renderStats() {
  const mine = rated();
  const scam = mine.filter((l) => ratings[l.id] === "scam").length;
  const worth = mine.length - scam;
  const agree = mine.filter((l) => ratings[l.id] === crowdSide(l)).length;

  $("stat-total").textContent = mine.length;
  $("stat-scam").textContent = scam;
  $("stat-worth").textContent = worth;
  $("stat-agree").textContent = mine.length ? Math.round((agree / mine.length) * 100) + "%" : "\u2013";

  $("profile-summary").textContent = mine.length
    ? mine.length + " of " + LISTINGS.length + " listings rated"
    : "You haven't rated anything yet";
}

function buildRow(listing) {
  const choice = ratings[listing.id];
  const stats = getStats(listing, choice);
  const other = choice === "scam" ? "worth" : "scam";

  const li = document.createElement("li");
  li.className = "vote-item";

  const info = document.createElement("div");
  info.className = "vote-info";

  const name = document.createElement("a");
  name.href = listingHref(listing);
  name.textContent = listing.name;

  const meta = document.createElement("p");
  meta.className = "listing-meta";
  meta.textContent =
    listing.category + " \u00b7 Community: " + stats.worthPct + "% Worth it, " + stats.scamPct + "% Scam";

  const bar = buildVerdictBar(stats);

  info.append(name, meta, bar);

  const side = document.createElement("div");
  side.className = "vote-side";

  const badge = document.createElement("p");
  badge.className = "vote-badge vote-badge-" + choice;
  badge.textContent = label(choice);

  const actions = document.createElement("div");
  actions.className = "vote-actions";

  const change = document.createElement("button");
  change.type = "button";
  change.className = "btn btn-small";
  change.textContent = "Change to " + label(other);
  change.addEventListener("click", () => {
    ratings[listing.id] = other;
    saveRatings(ratings);
    render();
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn btn-small btn-danger";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", "Remove your vote on " + listing.name);
  remove.addEventListener("click", () => {
    delete ratings[listing.id];
    saveRatings(ratings);
    render();
  });

  actions.append(change, remove);
  side.append(badge, actions);
  li.append(buildIconTile(listing.category), info, side);
  return li;
}

function render() {
  renderStats();

  const mine = rated();
  $("profile-empty").hidden = mine.length > 0;
  $("profile-list-section").hidden = mine.length === 0;
  $("stat-row").hidden = false;
  if (!mine.length) return;

  filterButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter));
    btn.classList.toggle("btn-primary", btn.dataset.filter === filter);
  });

  const shown = mine.filter((l) => filter === "all" || ratings[l.id] === filter);
  list.replaceChildren();

  if (!shown.length) {
    const empty = document.createElement("li");
    empty.className = "vote-empty";
    empty.textContent = "No " + label(filter).toLowerCase() + " votes yet.";
    list.append(empty);
    return;
  }

  shown.forEach((listing) => list.append(buildRow(listing)));
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    render();
  });
});

$("clear-btn").addEventListener("click", () => {
  if (!confirm("Clear all of your ratings? This can't be undone.")) return;
  ratings = {};
  saveRatings(ratings);
  filter = "all";
  render();
});

// --- Login banner ---

const CLIENT_ID = "943172599710-h0sdcf947048ntnjkm2mucfn8bc6027t.apps.googleusercontent.com";

function handleCredentialResponse(response) {
  const payload = decodeGoogleCredential(response.credential);
  addUser({
    sub: payload.sub,
    name: payload.name,
    email: payload.email,
    picture: payload.picture
  });
  renderBanner();
}

function renderBanner() {
  const banner = document.getElementById("profile-banner");
  const user = getCurrentUser();
  banner.replaceChildren();

  if (!user) {
    const icon = buildIconTile("");
    icon.classList.add("icon-tile-lg");
    icon.firstChild.className = "ph-bold ph-user-circle";

    const heading = document.createElement("p");
    heading.className = "banner-heading";
    heading.textContent = "Sign in to see your profile";

    const note = document.createElement("p");
    note.className = "banner-note";
    note.textContent = "Your votes are saved on this device either way.";

    const signinDiv = document.createElement("div");
    signinDiv.className = "banner-signin";

    banner.append(icon, heading, note, signinDiv);

    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
      });
      google.accounts.id.renderButton(signinDiv, { theme: "outline", size: "large" });
    }
    return;
  }

  const img = document.createElement("img");
  img.className = "banner-avatar";
  img.alt = "";
  img.referrerPolicy = "no-referrer"; // Google avatar URLs reject some referrers
  img.addEventListener("error", () => {
    img.src = "images/BlankUser.png";
  }, { once: true });
  img.src = user.picture || "images/BlankUser.png";

  const name = document.createElement("p");
  name.className = "banner-name";
  name.textContent = user.name;

  const email = document.createElement("p");
  email.className = "banner-email";
  email.textContent = user.email;

  const signout = document.createElement("button");
  signout.type = "button";
  signout.className = "btn btn-small banner-signout";
  signout.textContent = "Sign out";
  signout.addEventListener("click", () => {
    clearCurrentUser();
    renderBanner();
  });

  banner.append(img, name, email, signout);
}

// --- end login banner ---

render();
renderBanner();
// The Google script loads async; redraw once it's ready so the sign-in button appears.
window.addEventListener("load", renderBanner);