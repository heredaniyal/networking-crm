import pool from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const { id } = params;
  const body = await request.json();

  const fields = ["name", "phone", "email", "city", "area", "tags", "notes"];
  const updates = [];
  const values = [];
  let i = 1;

  for (const field of fields) {
    if (field in body) {
      updates.push(`${field} = $${i}`);
      values.push(body[field]);
      i++;
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE contacts SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const { id } = params;
  await pool.query("DELETE FROM contacts WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
