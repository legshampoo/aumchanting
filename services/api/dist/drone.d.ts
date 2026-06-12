export type DroneStatus = {
    enabled: boolean;
    started: boolean;
    connected: boolean;
    connecting: boolean;
    lastError: string | null;
    lastHumanActivityAt: number | null;
};
export declare function getDroneStatus(): DroneStatus;
export declare function notifyHumanActivity(room?: string): void;
export declare function startDrone(): void;
//# sourceMappingURL=drone.d.ts.map