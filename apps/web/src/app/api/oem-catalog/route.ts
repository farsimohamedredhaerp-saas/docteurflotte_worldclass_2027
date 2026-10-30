import { NextRequest, NextResponse } from 'next/server';
import { OEMCatalogClient } from '../../../lib/api-oem-catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const make = searchParams.get('make');
    const model = searchParams.get('model');

    const catalog = await OEMCatalogClient.loadCatalog();

    if (query) {
      const results = await OEMCatalogClient.searchCatalog(query);
      return NextResponse.json({
        total: results.length,
        items: results,
      });
    }

    if (make) {
      const filtered = catalog.filter((item) => {
        const makeMatch = item.brand.slug === make || item.brand.name.toLowerCase() === make.toLowerCase();
        if (model) {
          return makeMatch && (item.model.slug === model || item.model.name.toLowerCase().includes(model.toLowerCase()));
        }
        return makeMatch;
      });
      return NextResponse.json({
        total: filtered.length,
        items: filtered,
      });
    }

    return NextResponse.json({
      total: catalog.length,
      items: catalog,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch OEM catalog', details: error.message },
      { status: 500 }
    );
  }
}
