import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GA4_PROPERTY_ID = 'properties/542420596';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager' && user.custom_role !== 'manager')) {
      return Response.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { days = 30 } = await req.json().catch(() => ({}));

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics"));
    } catch (_e) {
      return Response.json({ notConnected: true }, { status: 200 });
    }

    const startDate = `${days}daysAgo`;
    const endDate = 'today';

    // Run all three GA4 Data API requests in parallel
    const [overviewRes, topPagesRes, trafficSourcesRes] = await Promise.all([
      // 1. Overview metrics
      fetch(`https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY_ID}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }),
      }),

      // 2. Top pages
      fetch(`https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY_ID}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 15,
        }),
      }),

      // 3. Traffic sources
      fetch(`https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY_ID}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionSourceMedium' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 15,
        }),
      }),
    ]);

    // Parse all responses
    const [overview, topPages, trafficSources] = await Promise.all([
      overviewRes.json(),
      topPagesRes.json(),
      trafficSourcesRes.json(),
    ]);

    // Check for API errors
    if (overview.error) {
      return Response.json({ error: overview.error.message, code: overview.error.code }, { status: 400 });
    }

    // Extract overview metrics
    const metrics = {};
    if (overview.rows && overview.rows.length > 0) {
      const metricHeaders = overview.metricHeaders || [];
      const values = overview.rows[0].metricValues || [];
      metricHeaders.forEach((header, i) => {
        metrics[header.name] = values[i]?.value || '0';
      });
    }

    // Extract top pages
    const pages = (topPages.rows || []).map(row => ({
      path: row.dimensionValues[0]?.value || '',
      pageViews: parseInt(row.metricValues[0]?.value || '0', 10),
      users: parseInt(row.metricValues[1]?.value || '0', 10),
    }));

    // Extract traffic sources
    const sources = (trafficSources.rows || []).map(row => ({
      sourceMedium: row.dimensionValues[0]?.value || '',
      sessions: parseInt(row.metricValues[0]?.value || '0', 10),
      users: parseInt(row.metricValues[1]?.value || '0', 10),
    }));

    return Response.json({
      overview: {
        totalUsers: parseInt(metrics.totalUsers || '0', 10),
        newUsers: parseInt(metrics.newUsers || '0', 10),
        sessions: parseInt(metrics.sessions || '0', 10),
        pageViews: parseInt(metrics.screenPageViews || '0', 10),
        avgSessionDuration: parseFloat(metrics.averageSessionDuration || '0'),
        bounceRate: parseFloat(metrics.bounceRate || '0'),
      },
      topPages: pages,
      trafficSources: sources,
      dateRange: { startDate, endDate, days },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});