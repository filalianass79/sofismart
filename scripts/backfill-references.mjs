import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ override: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function maxSeqForPrefix(used, prefix) {
  let max = 0;
  for (const ref of used) {
    if (typeof ref === "string" && ref.startsWith(prefix)) {
      const n = parseInt(ref.slice(prefix.length), 10);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }
  return max;
}

/** Prochaine référence séquentielle non utilisée (évite les violations de contrainte unique). */
function allocateRef(used, prefix, seq) {
  let n = seq;
  let newRef;
  do {
    n += 1;
    newRef = `${prefix}${String(n).padStart(4, "0")}`;
  } while (used.has(newRef));
  used.add(newRef);
  return { ref: newRef, seq: n };
}

async function dedupeReferences(table, column = "reference") {
  const { rows } = await pool.query(
    `SELECT id, "${column}" FROM "${table}" ORDER BY "createdAt" ASC NULLS LAST, id ASC`
  );
  const used = new Set(rows.map((r) => r[column]).filter(Boolean));
  const seen = new Map();
  const year = new Date().getFullYear();
  const prefix =
    table === "Depot"
      ? `DEP-${year}-`
      : table === "Sale"
        ? `VTE-${year}-`
        : table === "Supplier"
          ? `FRN-${year}-`
          : `REF-${year}-`;
  let seq = maxSeqForPrefix(used, prefix);

  for (const row of rows) {
    const ref = row[column];
    const key = ref ?? "__null__";
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0 && ref && !ref.endsWith("-LEGACY")) continue;

    const { ref: newRef, seq: nextSeq } = allocateRef(used, prefix, seq);
    seq = nextSeq;
    await pool.query(`UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`, [newRef, row.id]);
    console.log(`${table}: ${row.id} -> ${newRef}`);
  }
}

async function dedupePaymentRefs() {
  const { rows } = await pool.query(
    `SELECT id, "paymentReference" FROM "Payment" ORDER BY "createdAt" ASC`
  );
  const used = new Set(rows.map((r) => r.paymentReference).filter(Boolean));
  const kept = new Set();
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;
  let seq = maxSeqForPrefix(used, prefix);

  for (const row of rows) {
    const ref = row.paymentReference;
    if (ref && !kept.has(ref)) {
      kept.add(ref);
      continue;
    }

    const { ref: newRef, seq: nextSeq } = allocateRef(used, prefix, seq);
    seq = nextSeq;
    await pool.query(`UPDATE "Payment" SET "paymentReference" = $1 WHERE id = $2`, [newRef, row.id]);
    console.log(`Payment: ${row.id} -> ${newRef}`);
  }
}

async function dedupeNullableUnique(table, column) {
  const { rows } = await pool.query(
    `SELECT id, "${column}" FROM "${table}" WHERE "${column}" IS NOT NULL`
  );
  const seen = new Map();
  for (const row of rows) {
    const v = row[column];
    if (!seen.has(v)) {
      seen.set(v, row.id);
      continue;
    }
    await pool.query(`UPDATE "${table}" SET "${column}" = NULL WHERE id = $1`, [row.id]);
    console.log(`${table}.${column}: cleared duplicate on ${row.id}`);
  }
}

try {
  await dedupeReferences("Depot");
  await dedupeReferences("Sale");
  await dedupeReferences("Supplier");
  await dedupePaymentRefs();
  await dedupeNullableUnique("Supplier", "ice");
  await dedupeNullableUnique("Supplier", "cin");
  console.log("Done.");
} finally {
  await pool.end();
}
