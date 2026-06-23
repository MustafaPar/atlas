package com.atlas.common.util;

public final class GeoUtils {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtils() {}

    /**
     * Returns the great-circle distance in kilometres between two coordinates
     * using the Haversine formula.
     *
     * Accurate to within ~0.3% for distances under 50 km, which covers all
     * last-mile delivery scenarios. Does not account for road geometry — the
     * ETA engine applies a zone-level route factor on top of this value.
     */
    public static double haversineKm(double lat1, double lon1,
                                     double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                  * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
