import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { bigIntToNumber } from "@/lib/bigint";
import { displayHouseName, normalizeHouseName } from "@/lib/house-name";
import { logEvent } from "@/lib/event-log";

const DEFAULT_HOUSES = [
  "Stark", "Lannister", "Targaryen", "Baratheon", "Tyrell", "Martell", "Greyjoy", "Arryn",
];

const createSchema = z.object({
  name: z.string().min(1),
  groupId: z.number().int().min(0),
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
  isActive: z.boolean().optional(),
});

async function seedDefaultHouses() {
  const count = await prisma.house.count();
  if (count > 0) return;
  for (const name of DEFAULT_HOUSES) {
    const normal = normalizeHouseName(name);
    await prisma.house.upsert({
      where: { name: normal },
      create: { name: normal, groupId: null, r: 200, g: 200, b: 200, isActive: true },
      update: {},
    });
  }
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  await seedDefaultHouses();

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim() ?? "";

  const houses = await prisma.house.findMany({
    include: { balance: true },
    orderBy: { name: "asc" },
  });

  let filtered = houses;
  if (search) {
    const q = search.toLowerCase();
    filtered = houses.filter(
      (h) =>
        displayHouseName(h.name).toLowerCase().includes(q) ||
        (h.groupId != null && String(h.groupId).includes(q))
    );
  }

  const result = filtered.map((h) => ({
    id: h.id,
    name: displayHouseName(h.name),
    rawName: h.name,
    groupId: h.groupId,
    r: h.r,
    g: h.g,
    b: h.b,
    isActive: h.isActive,
    totalDrogons: h.balance ? bigIntToNumber(h.balance.drogonsBalance) : 0,
    activityPoints: h.balance?.activityPoints ?? 0,
    updatedAt: h.updatedAt?.toISOString() ?? null,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const name = normalizeHouseName(parsed.data.name);
  const existing = await prisma.house.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "House name already exists" }, { status: 409 });
  }

  const house = await prisma.house.create({
    data: {
      name,
      groupId: parsed.data.groupId,
      r: parsed.data.r,
      g: parsed.data.g,
      b: parsed.data.b,
      isActive: parsed.data.isActive ?? true,
    },
  });

  await prisma.houseBalance.create({
    data: { houseId: house.id, drogonsBalance: BigInt(0), activityPoints: 0 },
  });

  await logEvent("admin_house_create", `Created house: ${displayHouseName(house.name)}`, { houseId: house.id, name: house.name }, guard.session.id);

  const withBalance = await prisma.house.findUnique({
    where: { id: house.id },
    include: { balance: true },
  });

  return NextResponse.json({
    id: withBalance!.id,
    name: displayHouseName(withBalance!.name),
    rawName: withBalance!.name,
    groupId: withBalance!.groupId,
    r: withBalance!.r,
    g: withBalance!.g,
    b: withBalance!.b,
    isActive: withBalance!.isActive,
    totalDrogons: 0,
    activityPoints: 0,
    updatedAt: withBalance!.updatedAt?.toISOString() ?? null,
  });
}
