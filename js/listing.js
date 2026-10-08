// Listing page: one listing, looked up with listing.html?id=...
// LISTINGS and STORAGE_KEY come from listings.js; helpers come from common.js.

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

const wantedId = new URLSearchParams(location.search).get("id");
const listing = LISTINGS.find((l) => String(l.id) === wantedId);

function label(choice) {
  return choice === "worth" ? "Worth it" : "Scam";
}

function render(animateBar) {
  const mine = ratings[listing.id];
  const s = getStats(listing, mine);
  const text = verdictText(s);

  const big = $("big-pct");
  big.textContent = text.pct + " " + text.label;
  big.className = "big-pct" + (s.verdict === "split" ? "" : " is-" + s.verdict);

  const bar = buildVerdictBar(s);
  if (animateBar) bar.classList.add("animate");
  $("bar-slot").replaceChildren(bar);

  $("count-worth").textContent = s.worth.toLocaleString();
  $("count-scam").textContent = s.scam.toLocaleString();
  $("count-total").textContent = s.total.toLocaleString();

  $("vote-stamps").hidden = !!mine;
  $("vote-mine").hidden = !mine;
  if (mine) {
    const other = mine === "worth" ? "scam" : "worth";
    $("mine-line").textContent = "You voted " + label(mine);
    $("mine-change").textContent = "Change to " + label(other);
    $("mine-change").dataset.vote = other;
  }
}

if (!listing) {
  document.title = "Listing not found | Scam or Worth It?";
  $("not-found").hidden = false;
} else {
  document.title = listing.name + " | Scam or Worth It?";
  $("listing-icon").replaceChildren(buildIconTile(listing.category));
  $("listing-icon").firstChild.classList.add("icon-tile-lg");
  $("listing-name").textContent = listing.name;
  $("listing-meta").textContent = listing.category;
  $("listing-blurb").textContent = listing.blurb;
  $("listing-view").hidden = false;
  render(true);

  function castVote(choice) {
    ratings[listing.id] = choice;
    saveRatings(ratings);
    render(true);
  }

  document.querySelectorAll("#vote-stamps [data-vote]").forEach((button) => {
    button.addEventListener("click", () => {
      castVote(button.dataset.vote);
      $("mine-change").focus();
    });
  });

  $("mine-change").addEventListener("click", (event) => castVote(event.currentTarget.dataset.vote));

  $("mine-remove").addEventListener("click", () => {
    delete ratings[listing.id];
    saveRatings(ratings);
    render(false);
    document.querySelector("#vote-stamps [data-vote]").focus();
  });
}
