import pool from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const { rows } = await pool.query(
    "SELECT * FROM contacts ORDER BY created_at DESC"
  );
  return NextResponse.json(rows);
}

export async function POST(request) {
  const body = await request.json();
  const {
    name,
    phone = "",
    email = "",
    city = "Lahore",
    area = "",
    tags = [],
    notes = "",
  } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO contacts (name, phone, email, city, area, tags, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name.trim(), phone, email, city, area, tags, notes]
  );
  return NextResponse.json(rows[0], { status: 201 });
}

// Bulk import support: POST an array to this same route under a different
// shape { bulk: [...] } so the CSV importer can insert many rows at once.
export async function PUT(request) {
  const body = await request.json();
  const list = Array.isArray(body.bulk) ? body.bulk : [];
  if (list.length === 0) {
    return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = [];
    for (const c of list) {
      if (!c.name || !c.name.trim()) continue;
      const { rows } = await client.query(
        `INSERT INTO contacts (name, phone, email, city, area, tags, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          c.name.trim(),
          c.phone || "",
          c.email || "",
          c.city || "Lahore",
          c.area || "",
          c.tags || [],
          c.notes || "",
        ]
      );
      inserted.push(rows[0]);
    }
    await client.query("COMMIT");
    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
