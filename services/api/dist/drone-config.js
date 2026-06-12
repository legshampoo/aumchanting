/** Ambient drone bot settings — edit here, not in .env */
export const droneConfig = {
    enabled: true,
    room: 'globalAum',
    identity: 'drone-bot',
    /** Block guest tokens matching `drone-*` */
    reservedIdPrefix: 'drone',
    displayName: 'Ambient Om',
    tokenTtl: '10h',
    /** 0–1 peak scale before int16 conversion */
    volume: 1,
    sampleRate: 48000,
    channels: 1,
    frameSamples: 480,
    queueMs: 400,
    fadeMs: 120,
    /**
     * Om tone partials. Include upper harmonics — ~136 Hz alone is barely audible on
     * phone / laptop speakers; 300–800 Hz carries the perceived level.
     */
    tone: {
        partials: [
            { hz: 136.1, mix: 0.3 },
            { hz: 272.2, mix: 0.25 },
            { hz: 408.3, mix: 0.2 },
            { hz: 544.4, mix: 0.15 },
            { hz: 680.5, mix: 0.1 },
        ],
    },
    pollMs: 10_000,
    joinGraceMs: 90_000,
    reconnectMs: 5_000,
};
//# sourceMappingURL=drone-config.js.map