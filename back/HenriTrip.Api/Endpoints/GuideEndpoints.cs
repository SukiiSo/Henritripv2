using Microsoft.AspNetCore.Mvc;

static class GuideEndpoints
{
    public static void MapGuideEndpoints(this WebApplication app, AppDb db, Dictionary<string, int> sessions)
    {
        MapGuidesCrud(app, db, sessions);
        MapDayEndpoints(app, db, sessions);
        MapActivityEndpoints(app, db, sessions);
        MapInvitationEndpoints(app, db, sessions);
    }

    private static void MapGuidesCrud(WebApplication app, AppDb db, Dictionary<string, int> sessions)
    {
        app.MapGet("/api/guides", (HttpContext http, [FromQuery] string? search) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();

            IEnumerable<Guide> guides = db.Guides;

            if (!RequestHelpers.IsAdmin(current))
            {
                var invitedGuideIds = db.GuideInvitations
                    .Where(i => i.UserId == current.Id)
                    .Select(i => i.GuideId)
                    .ToHashSet();

                guides = guides.Where(g => invitedGuideIds.Contains(g.Id));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLowerInvariant();
                guides = guides.Where(g =>
                    g.Title.ToLowerInvariant().Contains(q) ||
                    g.Description.ToLowerInvariant().Contains(q) ||
                    (g.Destination?.ToLowerInvariant().Contains(q) ?? false));
            }

            var result = guides
                .OrderBy(g => g.Id)
                .Select(g => new GuideListItemResponse(
                    g.Id, g.Title, g.Description, g.Destination, g.CoverImageUrl,
                    g.NumberOfDays, g.Mobility.ToString(), g.Season.ToString(), g.ForWho.ToString()
                ));

            return Results.Ok(result);
        });

        app.MapGet("/api/guides/{id:int}", (HttpContext http, int id) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();

            var guide = db.Guides.FirstOrDefault(g => g.Id == id);
            if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

            if (!RequestHelpers.IsAdmin(current))
            {
                var invited = db.GuideInvitations.Any(i => i.UserId == current.Id && i.GuideId == id);
                if (!invited) return Results.StatusCode(403);
            }

            var days = db.GuideDays
                .Where(d => d.GuideId == id)
                .OrderBy(d => d.DayNumber)
                .Select(d => new GuideDayResponse(
                    d.Id, d.DayNumber, d.Title, d.Date?.ToString("yyyy-MM-dd"),
                    db.Activities
                        .Where(a => a.GuideDayId == d.Id)
                        .OrderBy(a => a.VisitOrder)
                        .Select(a => new ActivityResponse(
                            a.Id, a.Title, a.Description, a.Category.ToString(),
                            a.Address, a.PhoneNumber, a.OpeningHours, a.Website,
                            a.StartTime, a.EndTime, a.ForWho.ToString(), a.VisitOrder
                        ))
                        .ToList()
                ))
                .ToList();

            var invitedUserIds = db.GuideInvitations
                .Where(i => i.GuideId == id)
                .Select(i => i.UserId)
                .ToList();

            return Results.Ok(new GuideDetailResponse(
                guide.Id, guide.Title, guide.Description, guide.Destination, guide.CoverImageUrl,
                guide.NumberOfDays, guide.Mobility.ToString(), guide.Season.ToString(),
                guide.ForWho.ToString(), days, invitedUserIds
            ));
        });

        app.MapPost("/api/guides", (HttpContext http, CreateGuideRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
                return Results.BadRequest(new { message = "Titre et description obligatoires." });

            if (request.NumberOfDays < 1)
                return Results.BadRequest(new { message = "Le nombre de jours doit être >= 1." });

            if (!Enum.TryParse<Mobility>(request.Mobility, true, out var mobility))
                return Results.BadRequest(new { message = "Mobilité invalide." });

            if (!Enum.TryParse<Season>(request.Season, true, out var season))
                return Results.BadRequest(new { message = "Saison invalide." });

            if (!Enum.TryParse<ForWho>(request.ForWho, true, out var forWho))
                return Results.BadRequest(new { message = "PourWho invalide." });

            var guide = new Guide
            {
                Id = db.Guides.Any() ? db.Guides.Max(g => g.Id) + 1 : 1,
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                Destination = request.Destination?.Trim(),
                CoverImageUrl = request.CoverImageUrl?.Trim(),
                NumberOfDays = request.NumberOfDays,
                Mobility = mobility,
                Season = season,
                ForWho = forWho,
                CreatedByUserId = current.Id
            };

            db.Guides.Add(guide);

            for (int i = 1; i <= guide.NumberOfDays; i++)
            {
                db.GuideDays.Add(new GuideDay
                {
                    Id = db.GuideDays.Any() ? db.GuideDays.Max(d => d.Id) + 1 : 1,
                    GuideId = guide.Id,
                    DayNumber = i,
                    Title = $"Jour {i}"
                });
            }

            return Results.Created($"/api/guides/{guide.Id}", new { guide.Id });
        });

        app.MapPut("/api/guides/{id:int}", (HttpContext http, int id, UpdateGuideRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            var guide = db.Guides.FirstOrDefault(g => g.Id == id);
            if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
                return Results.BadRequest(new { message = "Titre et description obligatoires." });

            if (request.NumberOfDays < 1)
                return Results.BadRequest(new { message = "Le nombre de jours doit être >= 1." });

            if (!Enum.TryParse<Mobility>(request.Mobility, true, out var mobility))
                return Results.BadRequest(new { message = "Mobilité invalide." });

            if (!Enum.TryParse<Season>(request.Season, true, out var season))
                return Results.BadRequest(new { message = "Saison invalide." });

            if (!Enum.TryParse<ForWho>(request.ForWho, true, out var forWho))
                return Results.BadRequest(new { message = "PourWho invalide." });

            guide.Title = request.Title.Trim();
            guide.Description = request.Description.Trim();
            guide.Destination = request.Destination?.Trim();
            guide.CoverImageUrl = request.CoverImageUrl?.Trim();
            guide.Mobility = mobility;
            guide.Season = season;
            guide.ForWho = forWho;

            if (guide.NumberOfDays != request.NumberOfDays)
            {
                guide.NumberOfDays = request.NumberOfDays;
                var existingDays = db.GuideDays.Where(d => d.GuideId == guide.Id).OrderBy(d => d.DayNumber).ToList();

                if (existingDays.Count < request.NumberOfDays)
                {
                    for (int i = existingDays.Count + 1; i <= request.NumberOfDays; i++)
                    {
                        db.GuideDays.Add(new GuideDay
                        {
                            Id = db.GuideDays.Any() ? db.GuideDays.Max(d => d.Id) + 1 : 1,
                            GuideId = guide.Id, DayNumber = i, Title = $"Jour {i}"
                        });
                    }
                }
                else
                {
                    var toRemoveIds = existingDays.Where(d => d.DayNumber > request.NumberOfDays).Select(d => d.Id).ToHashSet();
                    db.Activities.RemoveAll(a => toRemoveIds.Contains(a.GuideDayId));
                    db.GuideDays.RemoveAll(d => toRemoveIds.Contains(d.Id));
                }
            }

            return Results.Ok(new { message = "Guide modifié." });
        });

        app.MapDelete("/api/guides/{id:int}", (HttpContext http, int id) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            var guide = db.Guides.FirstOrDefault(g => g.Id == id);
            if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

            var dayIds = db.GuideDays.Where(d => d.GuideId == id).Select(d => d.Id).ToHashSet();
            db.Activities.RemoveAll(a => dayIds.Contains(a.GuideDayId));
            db.GuideDays.RemoveAll(d => d.GuideId == id);
            db.GuideInvitations.RemoveAll(i => i.GuideId == id);
            db.Guides.Remove(guide);

            return Results.NoContent();
        });
    }

    private static void MapDayEndpoints(WebApplication app, AppDb db, Dictionary<string, int> sessions)
    {
        app.MapPut("/api/guides/{guideId:int}/days/{dayId:int}", (HttpContext http, int guideId, int dayId, UpdateGuideDayRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            var day = db.GuideDays.FirstOrDefault(d => d.Id == dayId && d.GuideId == guideId);
            if (day is null) return Results.NotFound(new { message = "Jour introuvable pour ce guide." });

            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { message = "Le titre du jour est obligatoire." });

            day.Title = request.Title.Trim();

            if (string.IsNullOrWhiteSpace(request.Date))
                day.Date = null;
            else if (DateTime.TryParse(request.Date, out var parsedDate))
                day.Date = parsedDate.Date;
            else
                return Results.BadRequest(new { message = "Date invalide. Format attendu: yyyy-MM-dd." });

            return Results.Ok(new { message = "Jour modifié." });
        });
    }

    private static void MapActivityEndpoints(WebApplication app, AppDb db, Dictionary<string, int> sessions)
    {
        app.MapPost("/api/guides/{guideId:int}/days/{dayId:int}/activities", (HttpContext http, int guideId, int dayId, CreateActivityRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            if (db.GuideDays.FirstOrDefault(d => d.Id == dayId && d.GuideId == guideId) is null)
                return Results.NotFound(new { message = "Jour introuvable pour ce guide." });

            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description) || string.IsNullOrWhiteSpace(request.Address))
                return Results.BadRequest(new { message = "Titre, description et adresse sont obligatoires." });

            if (!Enum.TryParse<ActivityCategory>(request.Category, true, out var category))
                return Results.BadRequest(new { message = "Catégorie invalide." });

            if (!Enum.TryParse<ForWho>(request.ForWho, true, out var forWho))
                return Results.BadRequest(new { message = "PourWho invalide." });

            var nextOrder = db.Activities.Where(a => a.GuideDayId == dayId).Select(a => a.VisitOrder).DefaultIfEmpty(0).Max() + 1;
            var visitOrder = request.VisitOrder.HasValue && request.VisitOrder.Value > 0 ? request.VisitOrder.Value : nextOrder;

            var activity = new Activity
            {
                Id = db.Activities.Any() ? db.Activities.Max(a => a.Id) + 1 : 1,
                GuideDayId = dayId,
                Title = request.Title.Trim(), Description = request.Description.Trim(),
                Category = category, Address = request.Address.Trim(),
                PhoneNumber = request.PhoneNumber?.Trim(), OpeningHours = request.OpeningHours?.Trim(),
                Website = request.Website?.Trim(), StartTime = request.StartTime?.Trim(),
                EndTime = request.EndTime?.Trim(), ForWho = forWho, VisitOrder = visitOrder
            };

            db.Activities.Add(activity);
            RequestHelpers.NormalizeActivityOrders(db, dayId);

            return Results.Created($"/api/guides/{guideId}", new { activity.Id });
        });

        app.MapPut("/api/guides/{guideId:int}/days/{dayId:int}/activities/{activityId:int}",
            (HttpContext http, int guideId, int dayId, int activityId, UpdateActivityRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            if (db.GuideDays.FirstOrDefault(d => d.Id == dayId && d.GuideId == guideId) is null)
                return Results.NotFound(new { message = "Jour introuvable pour ce guide." });

            var activity = db.Activities.FirstOrDefault(a => a.Id == activityId && a.GuideDayId == dayId);
            if (activity is null) return Results.NotFound(new { message = "Activité introuvable." });

            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description) || string.IsNullOrWhiteSpace(request.Address))
                return Results.BadRequest(new { message = "Titre, description et adresse sont obligatoires." });

            if (!Enum.TryParse<ActivityCategory>(request.Category, true, out var category))
                return Results.BadRequest(new { message = "Catégorie invalide." });

            if (!Enum.TryParse<ForWho>(request.ForWho, true, out var forWho))
                return Results.BadRequest(new { message = "PourWho invalide." });

            activity.Title = request.Title.Trim(); activity.Description = request.Description.Trim();
            activity.Category = category; activity.Address = request.Address.Trim();
            activity.PhoneNumber = request.PhoneNumber?.Trim(); activity.OpeningHours = request.OpeningHours?.Trim();
            activity.Website = request.Website?.Trim(); activity.StartTime = request.StartTime?.Trim();
            activity.EndTime = request.EndTime?.Trim(); activity.ForWho = forWho;

            if (request.VisitOrder.HasValue && request.VisitOrder.Value > 0)
                activity.VisitOrder = request.VisitOrder.Value;

            RequestHelpers.NormalizeActivityOrders(db, dayId);
            return Results.Ok(new { message = "Activité modifiée." });
        });

        app.MapPatch("/api/guides/{guideId:int}/activities/{activityId:int}/move",
            (HttpContext http, int guideId, int activityId, MoveActivityRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            var activity = db.Activities.FirstOrDefault(a => a.Id == activityId);
            if (activity is null) return Results.NotFound(new { message = "Activité introuvable." });

            var currentDay = db.GuideDays.FirstOrDefault(d => d.Id == activity.GuideDayId);
            if (currentDay is null || currentDay.GuideId != guideId)
                return Results.BadRequest(new { message = "Cette activité n'appartient pas à ce guide." });

            if (db.GuideDays.FirstOrDefault(d => d.Id == request.TargetDayId && d.GuideId == guideId) is null)
                return Results.NotFound(new { message = "Jour cible introuvable pour ce guide." });

            var oldDayId = activity.GuideDayId;
            activity.GuideDayId = request.TargetDayId;

            if (request.VisitOrder.HasValue && request.VisitOrder.Value > 0)
                activity.VisitOrder = request.VisitOrder.Value;
            else
                activity.VisitOrder = db.Activities.Where(a => a.GuideDayId == request.TargetDayId && a.Id != activity.Id).Select(a => a.VisitOrder).DefaultIfEmpty(0).Max() + 1;

            RequestHelpers.NormalizeActivityOrders(db, oldDayId);
            RequestHelpers.NormalizeActivityOrders(db, request.TargetDayId);

            return Results.Ok(new { message = "Activité déplacée." });
        });

        app.MapDelete("/api/guides/{guideId:int}/days/{dayId:int}/activities/{activityId:int}",
            (HttpContext http, int guideId, int dayId, int activityId) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            if (db.GuideDays.FirstOrDefault(d => d.Id == dayId && d.GuideId == guideId) is null)
                return Results.NotFound(new { message = "Jour introuvable pour ce guide." });

            var activity = db.Activities.FirstOrDefault(a => a.Id == activityId && a.GuideDayId == dayId);
            if (activity is null) return Results.NotFound(new { message = "Activité introuvable." });

            db.Activities.Remove(activity);
            RequestHelpers.NormalizeActivityOrders(db, dayId);

            return Results.NoContent();
        });
    }

    private static void MapInvitationEndpoints(WebApplication app, AppDb db, Dictionary<string, int> sessions)
    {
        app.MapPost("/api/guides/{guideId:int}/invitations", (HttpContext http, int guideId, CreateInvitationRequest request) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            if (db.Users.FirstOrDefault(u => u.Id == request.UserId) is null)
                return Results.NotFound(new { message = "Utilisateur introuvable." });

            if (db.GuideInvitations.Any(i => i.GuideId == guideId && i.UserId == request.UserId))
                return Results.BadRequest(new { message = "Invitation déjà existante." });

            db.GuideInvitations.Add(new GuideInvitation { GuideId = guideId, UserId = request.UserId });
            return Results.Ok(new { message = "Invitation ajoutée." });
        });

        app.MapGet("/api/guides/{guideId:int}/invitations", (HttpContext http, int guideId) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            var result = db.GuideInvitations
                .Where(i => i.GuideId == guideId)
                .Join(db.Users, i => i.UserId, u => u.Id,
                    (i, u) => new GuideInvitationResponse(guideId, u.Id, u.Email, u.Role.ToString()))
                .OrderBy(x => x.UserId)
                .ToList();

            return Results.Ok(result);
        });

        app.MapDelete("/api/guides/{guideId:int}/invitations/{userId:int}", (HttpContext http, int guideId, int userId) =>
        {
            var current = RequestHelpers.GetCurrentUser(http, db, sessions);
            if (current is null) return Results.Unauthorized();
            if (!RequestHelpers.IsAdmin(current)) return Results.StatusCode(403);

            if (db.Guides.FirstOrDefault(g => g.Id == guideId) is null)
                return Results.NotFound(new { message = "Guide introuvable." });

            var invitation = db.GuideInvitations.FirstOrDefault(i => i.GuideId == guideId && i.UserId == userId);
            if (invitation is null) return Results.NotFound(new { message = "Invitation introuvable." });

            db.GuideInvitations.Remove(invitation);
            return Results.NoContent();
        });
    }
}
