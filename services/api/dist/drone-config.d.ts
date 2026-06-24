/** Ambient drone bot settings — edit here, not in .env */
export declare const droneConfig: {
    /** When false, the drone never starts or joins the room */
    readonly enabled: false;
    readonly room: "globalAum";
    readonly identity: "drone-bot";
    /** Block guest tokens matching `drone-*` */
    readonly reservedIdPrefix: "drone";
    readonly displayName: "Ambient Om";
    readonly tokenTtl: "10h";
    /** 0–1 peak scale before int16 conversion (2.5 ≈ former client playback boost) */
    readonly volume: 2.5;
    readonly sampleRate: 48000;
    readonly channels: 1;
    readonly frameSamples: 480;
    readonly queueMs: 400;
    readonly fadeMs: 120;
    /**
     * Om tone partials. Include upper harmonics — ~136 Hz alone is barely audible on
     * phone / laptop speakers; 300–800 Hz carries the perceived level.
     */
    readonly tone: {
        readonly partials: readonly [{
            readonly hz: 136.1;
            readonly mix: 0.3;
        }, {
            readonly hz: 272.2;
            readonly mix: 0.25;
        }, {
            readonly hz: 408.3;
            readonly mix: 0.2;
        }, {
            readonly hz: 544.4;
            readonly mix: 0.15;
        }, {
            readonly hz: 680.5;
            readonly mix: 0.1;
        }];
    };
    readonly pollMs: 10000;
    readonly joinGraceMs: 90000;
    readonly reconnectMs: 5000;
};
export declare function isBotIdentity(identity: string | undefined): boolean;
//# sourceMappingURL=drone-config.d.ts.map