import './load-env.js';
import cors from 'cors';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { droneConfig } from './drone-config.js';
import { notifyHumanActivity, startDrone } from './drone.js';
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/token', async (req, res) => {
    const LIVEKIT_URL = process.env.LIVEKIT_URL;
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        return res
            .status(500)
            .json({ error: 'Missing LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET' });
    }
    const body = (req.body || {});
    const room = body.room || 'globalAum';
    const identity = body.identity || `guest_${Math.random().toString(16).slice(2)}`;
    if (identity === droneConfig.identity ||
        identity.startsWith(`${droneConfig.reservedIdPrefix}-`)) {
        return res.status(403).json({ error: 'Reserved identity' });
    }
    const name = body.name || 'Guest';
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity,
        name,
    });
    token.addGrant({ roomJoin: true, room });
    const jwt = await token.toJwt();
    notifyHumanActivity(room);
    return res.json({
        url: LIVEKIT_URL,
        token: jwt,
        room,
        identity,
        name,
    });
});
const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
    console.log(`api listening on http://localhost:${port}`);
    if (droneConfig.enabled) {
        startDrone();
    }
});
//# sourceMappingURL=index.js.map