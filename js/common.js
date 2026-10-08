// Shared UI helpers. Loaded after database/listings.js on every page that shows listings.
// Everything here works on a plain listing object { id, name, category, blurb, worth, scam },
// so when the data comes from a real backend only the loading code has to change.

// Same thresholds everywhere: 60%+ Worth it, 40% or less Scam, otherwise split.
function getStats(listing, myVote) {
  const worth = listing.worth + (myVote === "worth" ? 1 : 0);
  const scam = listing.scam + (myVote === "scam" ? 1 : 0);
  const total = worth + scam;
  const worthPct = total ? Math.round((worth / total) * 100) : 0;
  const scamPct = total ? 100 - worthPct : 0;
  let verdict = "split";
  if (worthPct >= 60) verdict = "worth";
  else if (worthPct <= 40) verdict = "scam";
  return { worth, scam, total, worthPct, scamPct, verdict };
}

function verdictText(s) {
  if (s.verdict === "worth") return { label: "Worth it", pct: s.worthPct + "%" };
  if (s.verdict === "scam") return { label: "Scam", pct: s.scamPct + "%" };
  return { label: "Split decision", pct: s.worthPct + "% / " + s.scamPct + "%" };
}

function listingHref(listing) {
  return "listing.html?id=" + encodeURIComponent(listing.id);
}

// Phosphor icon class for each category. Unknown categories get a generic tag.
const CATEGORY_ICONS = {
  "Product": "ph-package",
  "Online product": "ph-shopping-cart",
  "Company": "ph-buildings",
  "Restaurant": "ph-fork-knife",
  "Service": "ph-handshake",
  "Business": "ph-storefront",
  "Gym": "ph-barbell"
};

function buildIconTile(category) {
  const tile = document.createElement("span");
  tile.className = "icon-tile";
  tile.setAttribute("aria-hidden", "true");
  const icon = document.createElement("i");
  icon.className = "ph-bold " + (CATEGORY_ICONS[category] || "ph-tag");
  tile.append(icon);
  return tile;
}

function buildVerdictBar(s) {
  const bar = document.createElement("div");
  bar.className = "verdict-bar";
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", s.worthPct + "% Worth It, " + s.scamPct + "% Scam");
  const worth = document.createElement("span");
  worth.className = "bar-worth";
  worth.style.width = s.worthPct + "%";
  const scam = document.createElement("span");
  scam.className = "bar-scam";
  scam.style.width = s.scamPct + "%";
  bar.append(worth, scam);
  return bar;
}

function buildVerdictChip(s) {
  const text = verdictText(s);
  const chip = document.createElement("p");
  chip.className = "verdict verdict-" + s.verdict;
  const label = document.createElement("span");
  label.textContent = text.label;
  const pct = document.createElement("span");
  pct.textContent = text.pct;
  chip.append(label, pct);
  return chip;
}

// One listing card, used by the home and search pages.
// `myVote` is "worth", "scam", or undefined; it only changes the footer line.
function buildListingCard(listing, myVote) {
  const s = getStats(listing);

  const card = document.createElement("article");
  card.className = "listing-card";

  const top = document.createElement("div");
  top.className = "card-top";

  const heading = document.createElement("div");
  const h3 = document.createElement("h3");
  const link = document.createElement("a");
  link.href = listingHref(listing);
  link.textContent = listing.name;
  h3.append(link);
  const meta = document.createElement("p");
  meta.className = "listing-meta";
  meta.textContent = listing.category + " · " + s.total.toLocaleString() + " votes";
  heading.append(h3, meta);

  top.append(buildIconTile(listing.category), heading);

  const blurb = document.createElement("p");
  blurb.className = "card-blurb";
  blurb.textContent = listing.blurb;

  const foot = document.createElement("div");
  foot.className = "card-foot";
  if (myVote) {
    const voted = document.createElement("p");
    voted.className = "card-voted";
    voted.textContent = "You voted " + (myVote === "worth" ? "Worth it" : "Scam");
    foot.append(voted);
  } else {
    // Looks like a button but isn't a second tab stop: the whole card already links to the listing.
    const rate = document.createElement("span");
    rate.className = "btn btn-small card-rate";
    rate.setAttribute("aria-hidden", "true");
    rate.textContent = "Rate it";
    foot.append(rate);
  }

  card.append(top, blurb, buildVerdictBar(s), buildVerdictChip(s), foot);
  return card;
}
