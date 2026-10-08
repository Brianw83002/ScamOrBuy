// Search page. LISTINGS and STORAGE_KEY come from listings.js.

function loadRatings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

const $ = (id) => document.getElementById(id);
const input = $("search-input");
const categorySelect = $("category-select");
const verdictSelect = $("verdict-select");
const sortSelect = $("sort-select");
const results = $("results");
const noResults = $("no-results");

const ratings = loadRatings();

// getStats, buildListingCard and the other card helpers come from common.js.
const stats = (listing) => getStats(listing);

// Fill the category dropdown from the data.
[...new Set(LISTINGS.map((l) => l.category))].sort().forEach((category) => {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = category;
  categorySelect.append(option);
});

function matches(listing, query) {
  if (!query) return true;
  const text = (listing.name + " " + listing.category + " " + listing.blurb).toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word));
}

function render() {
  const query = input.value.trim();
  const category = categorySelect.value;
  const verdict = verdictSelect.value;
  const sort = sortSelect.value;

  const found = LISTINGS.filter(
    (l) =>
      matches(l, query) &&
      (category === "all" || l.category === category) &&
      (verdict === "all" || stats(l).verdict === verdict)
  );

  found.sort((a, b) => {
    const sa = stats(a);
    const sb = stats(b);
    if (sort === "worth") return sb.worthPct - sa.worthPct;
    if (sort === "scam") return sb.scamPct - sa.scamPct;
    if (sort === "name") return a.name.localeCompare(b.name);
    return sb.total - sa.total;
  });

  results.replaceChildren(...found.map((l) => buildListingCard(l, ratings[l.id])));
  results.hidden = found.length === 0;
  noResults.hidden = found.length > 0;

  $("result-count").textContent = query
    ? found.length + (found.length === 1 ? " result for \u201c" : " results for \u201c") + query + "\u201d"
    : found.length + (found.length === 1 ? " listing" : " listings");
}

// Keep the address bar in sync so a search can be shared or bookmarked.
function syncUrl() {
  const params = new URLSearchParams();
  if (input.value.trim()) params.set("q", input.value.trim());
  const qs = params.toString();
  try {
    history.replaceState(null, "", qs ? "?" + qs : location.pathname);
  } catch (err) {
    // Some file:// setups block this; searching still works.
  }
}

input.addEventListener("input", () => {
  syncUrl();
  render();
});
[categorySelect, verdictSelect, sortSelect].forEach((el) => el.addEventListener("change", render));

$("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  syncUrl();
  render();
});

$("reset-filters").addEventListener("click", () => {
  input.value = "";
  categorySelect.value = "all";
  verdictSelect.value = "all";
  sortSelect.value = "votes";
  syncUrl();
  render();
  input.focus();
});

// The home page search sends people here as search.html?q=...
input.value = new URLSearchParams(location.search).get("q") || "";
render();