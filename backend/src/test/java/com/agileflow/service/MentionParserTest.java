package com.agileflow.service;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MentionParserTest {

    private final MentionParser mentionParser = new MentionParser();

    @Test
    void extractMentionsReturnsDistinctHandlesInOrder() {
        Set<String> mentions = mentionParser.extractMentions("Bonjour @john_doe, merci de voir avec @alice et @john_doe.");

        assertEquals(Set.of("john_doe", "alice"), mentions);
    }
}
