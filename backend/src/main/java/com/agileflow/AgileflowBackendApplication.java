package com.agileflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AgileflowBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgileflowBackendApplication.class, args);
    }

}
