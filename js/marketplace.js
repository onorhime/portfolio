const list = document.querySelector("#program-list");
const status = document.querySelector("#market-status");
const refresh = document.querySelector("#reload-programs");

async function loadPrograms() {
  refresh.disabled = true;
  status.textContent = "Loading programs…";
  try {
    const response = await fetch(
      "https://mmyruzjemjecqyivhrgr.supabase.co/functions/v1/marketplace",
      { credentials: "omit" },
    );
    if (!response.ok) throw new Error("unavailable");
    const { programs } = await response.json();
    if (!Array.isArray(programs)) throw new Error("unreadable");
    const cards = programs.map((program) => {
      if (
        typeof program.name !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(program.slug)
      )
        throw new Error("unreadable");
      const card = document.createElement("article");
      card.className = "platform-card tone-yellow";
      const title = document.createElement("h3");
      title.textContent = program.name;
      const description = document.createElement("p");
      description.textContent = program.tagline || program.brand_name;
      const offer = document.createElement("p");
      offer.textContent = program.commission_headline || "";
      const link = document.createElement("a");
      link.className = "platform-link";
      link.href =
        "https://partners.kissmyapps.dev/discover/" +
        encodeURIComponent(program.slug);
      link.textContent = "View program";
      card.append(title, description, offer, link);
      return card;
    });
    list.replaceChildren(...cards);
    status.textContent = cards.length
      ? ""
      : "No public programs are open yet. If a merchant invited you, use their program link.";
  } catch {
    status.textContent = "The program list could not refresh. Try again.";
  } finally {
    refresh.disabled = false;
  }
}
refresh.addEventListener("click", loadPrograms);
void loadPrograms();
