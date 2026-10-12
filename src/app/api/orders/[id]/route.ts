import { getAdminDb } from "@/lib/server/firebase-admin";

// Exposes only the status. The unguessable order id acts as the capability.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/orders/[id]">,
) {
  const { id } = await ctx.params;
  const snap = await getAdminDb().collection("orders").doc(id).get();
  if (!snap.exists) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ status: snap.data()!.status });
}
