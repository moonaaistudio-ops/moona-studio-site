/* Public browser identifiers for the analytics clients.
   These values are intentionally safe to expose: they identify projects, not accounts.
   Keep credentials and server-side keys out of this endpoint. */
module.exports = (req, res) => {
  const config = {
    gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
    clarityProjectId: process.env.CLARITY_PROJECT_ID || '',
    posthogKey: process.env.POSTHOG_KEY || '',
    posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com'
  };

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.status(200).send(`window.MOONA_ANALYTICS_CONFIG=${JSON.stringify(config)};`);
};
