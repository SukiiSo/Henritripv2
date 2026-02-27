static class RequestHelpers
{
    public static User? GetCurrentUser(HttpContext http, AppDb db, Dictionary<string, int> sessions)
    {
        var authHeader = http.Request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(authHeader) &&
            authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = authHeader["Bearer ".Length..].Trim();
            if (sessions.TryGetValue(token, out var userIdFromToken))
                return db.Users.FirstOrDefault(u => u.Id == userIdFromToken);
        }

        if (http.Request.Headers.TryGetValue("X-User-Id", out var values) &&
            int.TryParse(values.FirstOrDefault(), out var userId))
        {
            return db.Users.FirstOrDefault(u => u.Id == userId);
        }

        return null;
    }

    public static bool IsAdmin(User user) => user.Role == UserRole.Admin;

    public static void NormalizeActivityOrders(AppDb db, int dayId)
    {
        var ordered = db.Activities
            .Where(a => a.GuideDayId == dayId)
            .OrderBy(a => a.VisitOrder)
            .ThenBy(a => a.Id)
            .ToList();

        for (int i = 0; i < ordered.Count; i++)
            ordered[i].VisitOrder = i + 1;
    }
}
