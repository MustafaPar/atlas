package com.atlas.domain.sla;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class SlaEvaluator {

    private SlaEvaluator() {}

    /**
     * Evaluates the SLA status of an order at a given point in time.
     *
     * Returns null when no SLA tier or deadline is set (no SLA applied).
     * Pure function — no Spring dependencies — safe to call from any layer.
     */
    public static SlaStatus evaluate(SlaTier tier, Instant promisedDeliveryAt,
                                     Instant deliveredAt, Instant now) {
        if (tier == null || promisedDeliveryAt == null) {
            return null;
        }

        if (deliveredAt != null) {
            return deliveredAt.isBefore(promisedDeliveryAt)
                    ? SlaStatus.ON_TRACK
                    : SlaStatus.BREACHED;
        }

        if (!now.isBefore(promisedDeliveryAt)) {
            return SlaStatus.BREACHED;
        }

        Instant warningStart = promisedDeliveryAt
                .minus(tier.getWarningThresholdMinutes(), ChronoUnit.MINUTES);

        return now.isBefore(warningStart) ? SlaStatus.ON_TRACK : SlaStatus.AT_RISK;
    }
}
