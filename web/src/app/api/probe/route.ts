import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tables = await query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    const allCols = await query(`
      SELECT TABLE_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);
    const grouped: Record<string, string[]> = {};
    for (const row of allCols as { TABLE_NAME: string; COLUMN_NAME: string }[]) {
      (grouped[row.TABLE_NAME] ??= []).push(row.COLUMN_NAME);
    }
    return NextResponse.json({
      tableNames: (tables as { TABLE_NAME: string }[]).map(t => t.TABLE_NAME),
      columns: grouped,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
