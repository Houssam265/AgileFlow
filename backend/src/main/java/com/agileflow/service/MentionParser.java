package com.agileflow.service;

import com.agileflow.entity.User;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class MentionParser {

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([a-zA-Z0-9_]+)");

    public Set<String> extractMentions(String contenu) {
        Set<String> mentions = new LinkedHashSet<>();
        if (contenu == null || contenu.isBlank()) {
            return mentions;
        }

        Matcher matcher = MENTION_PATTERN.matcher(contenu);
        while (matcher.find()) {
            mentions.add(matcher.group(1).toLowerCase(Locale.ROOT));
        }
        return mentions;
    }

    public String buildMentionKey(User user) {
        String email = user != null ? user.getEmail() : null;
        String localPart = email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "";
        String normalized = Normalizer.normalize(localPart, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9_]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "")
                .toLowerCase(Locale.ROOT);
        if (!normalized.isBlank()) {
            return normalized;
        }
        return "user_" + (user != null ? user.getId() : "unknown");
    }
}
