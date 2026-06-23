package com.atlas.common.util;

import com.atlas.domain.zone.GeoPoint;

import java.util.List;

public final class PolygonUtils {

    private PolygonUtils() {}

    /**
     * Ray-casting point-in-polygon test (O(n), works for convex and concave polygons).
     * Casts a horizontal ray from (lat, lng) rightward and counts edge crossings.
     * Odd crossings → inside; even → outside.
     */
    public static boolean contains(List<GeoPoint> polygon, double lat, double lng) {
        int n = polygon.size();
        boolean inside = false;
        for (int i = 0, j = n - 1; i < n; j = i++) {
            double latI = polygon.get(i).lat();
            double lngI = polygon.get(i).lng();
            double latJ = polygon.get(j).lat();
            double lngJ = polygon.get(j).lng();
            if (((latI > lat) != (latJ > lat)) &&
                    (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI)) {
                inside = !inside;
            }
        }
        return inside;
    }
}
