// ---------- Saved ratings (localStorage) ----------
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
    // Storage unavailable: ratings just last until the page is closed.
  }
}

// ---------- Elements ----------
const $ = (id) => document.getElementById(id);
const deck = $("deck");
const done = $("rate-done");
const voteArea = $("vote-area");
const result = $("rate-result");
const skipBtn = $("skip-btn");
const nextBtn = $("next-btn");

// Two cards share the deck. `front` is up for a vote, `back` waits behind it.
// They swap roles after every shuffle, so the DOM elements are reused.
let front = $("card-a");
let back = $("card-b");

let ratings = loadRatings();
let current = null;   // listing on the front card
let upcoming = null;  // listing on the card behind it

// ---------- Helpers ----------
function unrated() {
  return LISTINGS.filter((listing) => !ratings[listing.id]);
}

// Random unrated listing, never the one passed in.
function pickOther(exclude) {
  const pool = unrated().filter((listing) => !exclude || listing.id !== exclude.id);
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

function updateCount() {
  const left = unrated().length;
  $("rate-count").textContent = left
    ? left + " of " + LISTINGS.length + " listings left to rate"
    : "All " + LISTINGS.length + " listings rated";
}

function fillCard(card, listing) {
  card.hidden = !listing;
  if (!listing) return;
  card.querySelector(".deck-icon").replaceChildren(buildIconTile(listing.category));
  card.querySelector(".deck-category").textContent = listing.category;
  card.querySelector(".deck-name").textContent = listing.name;
  card.querySelector(".deck-blurb").textContent = listing.blurb;
}

function setRoles() {
  front.className = "deck-card deck-front";
  back.className = "deck-card deck-back";
  front.removeAttribute("aria-hidden");
  front.inert = false;
  back.setAttribute("aria-hidden", "true");
  back.inert = true;
}

// Vote buttons back, results panel away.
function showVoteButtons() {
  result.hidden = true;
  voteArea.hidden = false;
  skipBtn.hidden = unrated().length < 2;
}

// ---------- Screens ----------
// Draws the current state with no animation (first load, reset, reduced motion).
function render() {
  updateCount();

  if (!current) {
    deck.hidden = true;
    voteArea.hidden = true;
    result.hidden = true;
    done.hidden = false;
    return;
  }

  done.hidden = true;
  deck.hidden = false;
  fillCard(front, current);
  fillCard(back, upcoming);
  showVoteButtons();
}

function vote(choice) {
  ratings[current.id] = choice;
  saveRatings(ratings);

  // Community totals include the vote that was just cast.
  const worth = current.worth + (choice === "worth" ? 1 : 0);
  const scam = current.scam + (choice === "scam" ? 1 : 0);
  const total = worth + scam;
  const worthPct = Math.round((worth / total) * 100);
  const scamPct = 100 - worthPct;

  let verdictClass = "verdict-split";
  let label = "Split decision";
  let pct = worthPct + "% / " + scamPct + "%";
  if (worthPct >= 60) {
    verdictClass = "verdict-worth";
    label = "Worth it";
    pct = worthPct + "%";
  } else if (worthPct <= 40) {
    verdictClass = "verdict-scam";
    label = "Scam";
    pct = scamPct + "%";
  }

  $("result-vote").textContent = "You voted " + (choice === "worth" ? "Worth it" : "Scam");
  $("result-votes").textContent = "Community results \u00b7 " + total.toLocaleString() + " votes";
  $("bar-worth").style.width = worthPct + "%";
  $("bar-scam").style.width = scamPct + "%";
  $("result-bar").setAttribute("aria-label", worthPct + "% Worth It, " + scamPct + "% Scam");
  $("result-bar").classList.add("animate");
  $("result-verdict").className = "verdict " + verdictClass;
  $("result-label").textContent = label;
  $("result-pct").textContent = pct;

  voteArea.hidden = true;
  result.hidden = false;
  nextBtn.textContent = unrated().length ? "Next listing" : "Finish";
  updateCount();
  nextBtn.focus();
}

// ---------- Shuffle animation ----------
// The front card (A) lifts up and over the card behind it (B) until it has
// completely cleared it, then slides down behind B while B moves forward.
// Only transform is animated, so the browser can run it without re-laying out the page.
const BACK_POSE = "translateY(14px) rotate(0deg) scale(0.95)"; // matches .deck-back
const FRONT_POSE = "translateY(0px) rotate(0deg) scale(1)";
const SHUFFLE_MS = 800;

let finishShuffle = null; // set while a shuffle is running

function shuffleNext() {
  // If the last shuffle is still running, wrap it up right away.
  if (finishShuffle) finishShuffle();

  const next = pickNext();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!next || reduceMotion || deck.hidden) {
    current = next;
    upcoming = next ? pickOther(next) : null;
    render();
    return;
  }

  const outgoing = front;
  const incoming = back;
  // Far enough up that the card is completely clear of the one behind it.
  const lift = outgoing.offsetHeight + 28;
  const top = "translateY(" + -lift + "px) rotate(-4deg) scale(1)";

  current = next;
  upcoming = pickOther(next);
  fillCard(incoming, next);
  updateCount();
  showVoteButtons(); // buttons are ready as soon as the next card starts coming forward

  const fadeAtEnd = upcoming ? 1 : 0; // nothing left to put behind the deck

  const flyOut = outgoing.animate([
    { transform: FRONT_POSE, zIndex: 2, opacity: 1, offset: 0, easing: "cubic-bezier(0.25, 0.8, 0.35, 1)" },
    { transform: top, zIndex: 2, opacity: 1, offset: 0.42 },
    { transform: top, zIndex: 0, opacity: 1, offset: 0.5, easing: "cubic-bezier(0.55, 0, 0.3, 1)" },
    { transform: BACK_POSE, zIndex: 0, opacity: fadeAtEnd, offset: 1 }
  ], { duration: SHUFFLE_MS, fill: "forwards" });

  const comeForward = incoming.animate([
    { transform: BACK_POSE, offset: 0 },
    { transform: BACK_POSE, offset: 0.4, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" },
    { transform: FRONT_POSE, offset: 1 }
  ], { duration: SHUFFLE_MS, fill: "forwards" });

  finishShuffle = () => {
    finishShuffle = null;
    flyOut.cancel();
    comeForward.cancel();
    // The cards have already traded places on screen, so trade roles to match.
    front = incoming;
    back = outgoing;
    setRoles();
    fillCard(back, upcoming); // hidden behind the new front card
  };

  flyOut.onfinish = () => {
    if (finishShuffle) finishShuffle();
  };
}

// The card behind is already waiting; only fall back to a random pick if it isn't.
function pickNext() {
  if (upcoming && !ratings[upcoming.id]) return upcoming;
  return pickOther(current);
}

// ---------- Events ----------
document.querySelectorAll("[data-vote]").forEach((button) => {
  button.addEventListener("click", () => vote(button.dataset.vote));
});

skipBtn.addEventListener("click", shuffleNext);
nextBtn.addEventListener("click", shuffleNext);

$("reset-btn").addEventListener("click", () => {
  if (finishShuffle) finishShuffle();
  ratings = {};
  saveRatings(ratings);
  current = pickOther(null);
  upcoming = current ? pickOther(current) : null;
  render();
});

// ---------- Start ----------
current = pickOther(null);
upcoming = current ? pickOther(current) : null;
setRoles();
render();