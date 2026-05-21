package com.agileflow.security;

import com.agileflow.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final ObjectProvider<AuthService> authServiceProvider;
    private final ObjectProvider<OAuth2AuthorizedClientService> authorizedClientServiceProvider;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauthUser = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId();
        String providerAccessToken = getProviderAccessToken(oauthToken);

        AuthService authService = authServiceProvider.getObject();
        AuthService.AuthResponse auth = authService.loginWithOAuth(provider, oauthUser, providerAccessToken);

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/oauth2/redirect")
                .queryParam("accessToken", auth.accessToken())
                .queryParam("refreshToken", auth.refreshToken())
                .queryParam("userId", auth.userId())
                .queryParam("email", auth.email())
                .queryParam("role", auth.role())
                .queryParam("prenom", auth.prenom())
                .queryParam("nom", auth.nom())
                .build()
                .encode()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private String getProviderAccessToken(OAuth2AuthenticationToken oauthToken) {
        OAuth2AuthorizedClientService authorizedClientService = authorizedClientServiceProvider.getIfAvailable();
        if (authorizedClientService == null) {
            return null;
        }

        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                oauthToken.getAuthorizedClientRegistrationId(),
                oauthToken.getName()
        );
        if (client == null || client.getAccessToken() == null) {
            return null;
        }

        return client.getAccessToken().getTokenValue();
    }
}
