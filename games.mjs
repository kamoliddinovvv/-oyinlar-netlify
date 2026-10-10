import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore("games");
  const load = async () => (await store.get("list", { type: "json" })) || [];
  const pass = process.env.ADMIN_PASSWORD;
  const isAdmin = !!pass && req.headers.get("x-admin") === pass;

  if (url.pathname === "/api/login" && req.method === "POST")
    return json({ ok: isAdmin }, isAdmin ? 200 : 401);

  if (url.pathname === "/api/games" && req.method === "GET") return json(await load());

  if (url.pathname === "/api/games" && req.method === "POST") {
    if (!isAdmin) return json({ error: "parol xato" }, 401);
    let g;
    try { g = await req.json(); } catch { return json({ error: "xato" }, 400); }
    if (!g.title || !/^https?:\/\//i.test(g.url)) return json({ error: "noto'g'ri ma'lumot" }, 400);
    const all = await load();
    all.unshift({
      id: Date.now().toString(36),
      title: String(g.title).slice(0, 60),
      url: g.url,
      type: String(g.type || "").slice(0, 30),
      img: g.img || "",
    });
    await store.setJSON("list", all);
    return json(all);
  }

  if (url.pathname.startsWith("/api/games/") && req.method === "DELETE") {
    if (!isAdmin) return json({ error: "parol xato" }, 401);
    const id = url.pathname.split("/").pop();
    const all = (await load()).filter((x) => x.id !== id);
    await store.setJSON("list", all);
    return json(all);
  }

  return json({ error: "topilmadi" }, 404);
};

export const config = { path: ["/api/login", "/api/games", "/api/games/*"] };