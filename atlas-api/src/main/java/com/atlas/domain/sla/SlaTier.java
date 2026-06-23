package com.atlas.domain.sla;

public enum SlaTier {

    STANDARD(60,  12),
    EXPRESS (30,   6),
    PRIORITY(15,   3),
    SAME_DAY(480, 96);

    private final int windowMinutes;
    private final int warningThresholdMinutes;

    SlaTier(int windowMinutes, int warningThresholdMinutes) {
        this.windowMinutes = windowMinutes;
        this.warningThresholdMinutes = warningThresholdMinutes;
    }

    public int getWindowMinutes() {
        return windowMinutes;
    }

    public int getWarningThresholdMinutes() {
        return warningThresholdMinutes;
    }
}
