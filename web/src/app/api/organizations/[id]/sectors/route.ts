import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(
      `SELECT s.IndustrySectorID, s.SectorName
       FROM dbo.OrganizationSectors os
       JOIN dbo.IndustrySectors s ON os.IndustrySectorID = s.IndustrySectorID
       WHERE os.OrganizationID = @id`,
      { id: Number(id) },
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sectorIds: number[] = body.sectorIds ?? [];
    if (sectorIds.length === 0) return NextResponse.json({ error: 'sectorIds is required' }, { status: 400 });

    for (const sectorId of sectorIds) {
      await query(
        'INSERT INTO dbo.OrganizationSectors (OrganizationID, IndustrySectorID) VALUES (@orgId, @sectorId)',
        { orgId: Number(id), sectorId },
      );
    }
    return NextResponse.json({ success: true, count: sectorIds.length }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sectorIds: number[] = body.sectorIds ?? [];

    await query('DELETE FROM dbo.OrganizationSectors WHERE OrganizationID = @id', { id: Number(id) });

    for (const sectorId of sectorIds) {
      await query(
        'INSERT INTO dbo.OrganizationSectors (OrganizationID, IndustrySectorID) VALUES (@orgId, @sectorId)',
        { orgId: Number(id), sectorId },
      );
    }
    return NextResponse.json({ success: true, count: sectorIds.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
