package com.agileflow.validation;

import com.agileflow.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Règles alignées avec l’inscription : 8+ caractères, majuscule, minuscule, chiffre,
 * caractère spécial parmi !@#$%^&*
 */
@Component
public class PasswordValidator {

    private static final Pattern PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$");

    public static final String REQUIREMENTS_MESSAGE =
            "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, "
                    + "un chiffre et un caractère spécial parmi !@#$%^&*";

    public void assertValid(String rawPassword) {
        if (rawPassword == null || !PATTERN.matcher(rawPassword).matches()) {
            throw new BadRequestException(REQUIREMENTS_MESSAGE);
        }
    }
}
