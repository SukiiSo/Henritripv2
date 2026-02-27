static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app, AppDb db, Dictionary<string, int> sessions)
    {
        app.MapGet("/api/users", (HttpContext http) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            var result = db.Users.Select(u => new UserResponse(u.Id, u.Email, u.Role.ToString()));
            return Results.Ok(result);
        });

        app.MapPost("/api/users", (HttpContext http, CreateUserRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { message = "Email et mot de passe sont obligatoires." });

            if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
                return Results.BadRequest(new { message = "Role invalide. Utiliser 'Admin' ou 'User'." });

            if (db.Users.Any(u => u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)))
                return Results.BadRequest(new { message = "Email déjà utilisé." });

            var newUser = new User
            {
                Id = db.Users.Any() ? db.Users.Max(u => u.Id) + 1 : 1,
                Email = request.Email.Trim(),
                Password = request.Password.Trim(),
                Role = role
            };

            db.Users.Add(newUser);

            return Results.Created(
                $"/api/users/{newUser.Id}",
                new UserResponse(newUser.Id, newUser.Email, newUser.Role.ToString())
            );
        });

        app.MapDelete("/api/users/{id:int}", (HttpContext http, int id) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (current.Id == id)
                return Results.BadRequest(new { message = "Un admin ne peut pas se supprimer lui-même." });

            var user = db.Users.FirstOrDefault(u => u.Id == id);
            if (user is null) return Results.NotFound(new { message = "Utilisateur introuvable." });

            db.Users.Remove(user);
            db.GuideInvitations.RemoveAll(i => i.UserId == id);

            var tokensToRemove = sessions.Where(kv => kv.Value == id).Select(kv => kv.Key).ToList();
            foreach (var token in tokensToRemove)
                sessions.Remove(token);

            return Results.NoContent();
        });
    }
}
