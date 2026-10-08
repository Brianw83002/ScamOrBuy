// Home page. LISTINGS and STORAGE_KEY come from listings.js; helpers come from common.js.

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
    // Storage unavailable: the vote just lasts until the page is closed.
  }
}

const $ = (id) => document.getElementById(id);
const ratings = loadRatings();

// ---------- Hero card: vote on one listing without leaving the page ----------
let featured = null;

function pickFeatured(exclude) {
  const pool = LISTINGS.filter((l) => !ratings[l.id] && (!exclude || l.id !== exclude.id));
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

function showFeatured() {
  const card = $("hero-card");
  const done = $("hero-done");
  card.hidden = !featured;
  done.hidden = !!featured;
  if (!featured) return;

  $("hero-icon").replaceChildren(buildIconTile(featured.category));
  $("hero-name").textContent = featured.name;
  $("hero-meta").textContent = featured.category;
  $("hero-blurb").textContent = featured.blurb;
  $("hero-stamps").hidden = false;
  $("hero-result").hidden = true;
}

function voteFeatured(choice) {
  ratings[featured.id] = choice;
  saveRatings(ratings);

  const s = getStats(featured, choice);
  $("hero-result-vote").textContent = "You voted " + (choice === "worth" ? "Worth it" : "Scam");
  const bar = buildVerdictBar(s);
  bar.classList.add("animate");
  $("hero-result-stats").replaceChildren(bar, buildVerdictChip(s));

  $("hero-stamps").hidden = true;
  $("hero-result").hidden = false;
  $("hero-another").hidden = !pickFeatured(featured);
  $("hero-another").focus();
}

document.querySelectorAll("#hero-stamps [data-vote]").forEach((button) => {
  button.addEventListener("click", () => voteFeatured(button.dataset.vote));
});

$("hero-another").addEventListener("click", () => {
  featured = pickFeatured(featured);
  showFeatured();
});

featured = pickFeatured();
showFeatured();

// ---------- Popular: the most-voted listings ----------
const popular = [...LISTINGS]
  .sort((a, b) => b.worth + b.scam - (a.worth + a.scam))
  .slice(0, 6);
$("popular-grid").replaceChildren(
  ...popular.map((listing, i) => {
    const card = buildListingCard(listing, ratings[listing.id]);
    card.classList.add("fade-up");
    card.style.setProperty("--i", i);
    return card;
  })
);

// ---------- Recently added: the newest listings (highest ids) ----------
const recent = [...LISTINGS].sort((a, b) => b.id - a.id).slice(0, 4);
$("recent-list").replaceChildren(
  ...recent.map((listing) => {
    const li = document.createElement("li");

    const info = document.createElement("div");
    info.className = "recent-info";
    const link = document.createElement("a");
    link.href = listingHref(listing);
    link.textContent = listing.name;
    const meta = document.createElement("p");
    meta.className = "listing-meta";
    meta.textContent = listing.category;
    info.append(link, meta);

    const action = document.createElement("a");
    action.className = "btn btn-small";
    action.href = listingHref(listing);
    action.textContent = ratings[listing.id] ? "View" : "Rate it";
    action.setAttribute("aria-label", (ratings[listing.id] ? "View " : "Rate ") + listing.name);

    li.append(buildIconTile(listing.category), info, buildVerdictChip(getStats(listing)), action);
    return li;
  })
);
