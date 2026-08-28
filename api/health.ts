export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    service: 'Golf Weather SG API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
  });
}
