package com.agileflow.exception;

/**
 * Erreur métier / validation (HTTP 400).
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
