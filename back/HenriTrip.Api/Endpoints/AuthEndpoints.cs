static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app, AppDb db, Dictionary<string, int> sessions)
    {
        app.MapPost("/api/auth/login", (LoginRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { message = "Email et mot de passe sont obligatoires." });

            var user = db.Users.FirstOrDefault(u =>
                u.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase) &&
                u.Password == request.Password.Trim());

            if (user is null)
                return Results.Unauthorized();

            var token = $"mock_{Guid.NewGuid():N}";
            sessions[token] = user.Id;

            return Results.Ok(new LoginResponse(
                token,
                new UserResponse(user.Id, user.Email, user.Role.ToString())
            ));
        });

        app.MapPost("/api/auth/logout", (HttpContext http) =>
        {
            var authHeader = http.Request.Headers.Authorization.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(authHeader) &&
                authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authHeader["Bearer ".Length..].Trim();
                sessions.Remove(token);
            }

            return Results.Ok(new { message = "Déconnecté." });
        });

        app.MapGet("/api/me", (HttpContext http) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();

            return Results.Ok(new UserResponse(current.Id, current.Email, current.Role.ToString()));
        });
    }
}
