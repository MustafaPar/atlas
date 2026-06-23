package com.atlas.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Universal response envelope returned by every endpoint.
 *
 * Shape is always consistent regardless of HTTP status code:
 *   Success  →  { "success": true,  "data": {...}, "message": null  }
 *   Failure  →  { "success": false, "data": null,  "message": "..." }
 *
 * Null fields are suppressed in serialisation so clients only see
 * the fields that are actually populated.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, String message) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> ok() {
        return new ApiResponse<>(true, null, null);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }

    public static <T> ApiResponse<T> of(boolean success, T data, String message) {
        return new ApiResponse<>(success, data, message);
    }
}
