package com.agileflow.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class SpringMailConfigurationTest {

    @Autowired
    private JavaMailSender javaMailSender;

    @Test
    void javaMailSenderBeanIsAvailable() {
        assertThat(javaMailSender).isNotNull();
    }
}
