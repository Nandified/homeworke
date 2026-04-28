import { Pool } from "pg";

export type ExpressEstimateJobStatus = "QUEUED" | "PROCESSING" | "DONE" | "ERROR";

export type ExpressEstimateJobRow = {
  reportId: string;
  status: ExpressEstimateJobStatus;
  progressPct: number;
  step: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  pool = new Pool({ connectionString: url, max: 3 });
  return pool;
}

export async function ensureExpressEstimateJobsTable() {
  const p = getPool();
  await p.query(`
    create table if not exists express_estimate_jobs (
      report_id text primary key,
      status text not null,
      progress_pct int not null default 0,
      step text,
      error text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
  await p.query(`create index if not exists express_estimate_jobs_status_updated_at_idx on express_estimate_jobs(status, updated_at desc);`);
}

export async function upsertJob(input: {
  reportId: string;
  status: ExpressEstimateJobStatus;
  progressPct?: number;
  step?: string | null;
  error?: string | null;
}) {
  await ensureExpressEstimateJobsTable();
  const p = getPool();
  const progress = Math.max(0, Math.min(100, Math.round(input.progressPct ?? 0)));
  const step = input.step ?? null;
  const error = input.error ?? null;
  await p.query(
    `insert into express_estimate_jobs(report_id,status,progress_pct,step,error)
     values($1,$2,$3,$4,$5)
     on conflict (report_id) do update set
       status=excluded.status,
       progress_pct=excluded.progress_pct,
       step=excluded.step,
       error=excluded.error,
       updated_at=now()`,
    [input.reportId, input.status, progress, step, error]
  );
}

export async function getJob(reportId: string): Promise<ExpressEstimateJobRow | null> {
  await ensureExpressEstimateJobsTable();
  const p = getPool();
  const r = await p.query(
    `select report_id, status, progress_pct, step, error, created_at, updated_at
     from express_estimate_jobs where report_id=$1`,
    [reportId]
  );
  const row = r.rows?.[0];
  if (!row) return null;
  return {
    reportId: String(row.report_id),
    status: String(row.status) as any,
    progressPct: Number(row.progress_pct) || 0,
    step: row.step ? String(row.step) : null,
    error: row.error ? String(row.error) : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listJobs(limit = 50): Promise<ExpressEstimateJobRow[]> {
  await ensureExpressEstimateJobsTable();
  const p = getPool();
  const r = await p.query(
    `select report_id, status, progress_pct, step, error, created_at, updated_at
     from express_estimate_jobs
     order by updated_at desc
     limit $1`,
    [limit]
  );
  return (r.rows || []).map((row) => ({
    reportId: String(row.report_id),
    status: String(row.status) as any,
    progressPct: Number(row.progress_pct) || 0,
    step: row.step ? String(row.step) : null,
    error: row.error ? String(row.error) : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}
