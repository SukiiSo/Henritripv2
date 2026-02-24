using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HenriTrip API", Version = "v1" });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("front", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("front");

var db = SeedData.Create();

app.MapGet("/", () => Results.Redirect("/swagger"));

/*
 Auth mock pour le test:
 - Passer X-User-Id dans les headers
 - Exemple admin: 1
 - Exemple user: 2 ou 3
*/
User? GetCurrentUser(HttpContext http)
{
    if (!http.Request.Headers.TryGetValue("X-User-Id", out var values))
    {
        return null;
    }

    if (!int.TryParse(values.FirstOrDefault(), out var userId))
    {
        return null;
    }

    return db.Users.FirstOrDefault(u => u.Id == userId);
}

bool IsAdmin(User user) => user.Role == UserRole.Admin;

/* ---------------- USERS ---------------- */

app.MapGet("/api/users", (HttpContext http) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    var result = db.Users.Select(u => new UserResponse(
        u.Id,
        u.Email,
        u.Role.ToString()
    ));

    return Results.Ok(result);
});

app.MapPost("/api/users", (HttpContext http, CreateUserRequest request) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "Email et mot de passe sont obligatoires." });
    }

    if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
    {
        return Results.BadRequest(new { message = "Role invalide. Utiliser 'Admin' ou 'User'." });
    }

    if (db.Users.Any(u => u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)))
    {
        return Results.BadRequest(new { message = "Email déjà utilisé." });
    }

    var newUser = new User
    {
        Id = db.Users.Any() ? db.Users.Max(u => u.Id) + 1 : 1,
        Email = request.Email.Trim(),
        Password = request.Password.Trim(),
        Role = role
    };

    db.Users.Add(newUser);

    return Results.Created($"/api/users/{newUser.Id}", new UserResponse(newUser.Id, newUser.Email, newUser.Role.ToString()));
});

app.MapDelete("/api/users/{id:int}", (HttpContext http, int id) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    var user = db.Users.FirstOrDefault(u => u.Id == id);
    if (user is null) return Results.NotFound(new { message = "Utilisateur introuvable." });

    db.Users.Remove(user);

    db.GuideInvitations.RemoveAll(i => i.UserId == id);

    return Results.NoContent();
});

/* ---------------- GUIDES ---------------- */

// Liste guides
app.MapGet("/api/guides", (HttpContext http, [FromQuery] string? search) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();

    IEnumerable<Guide> guides = db.Guides;

    if (!IsAdmin(current))
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
            g.Id,
            g.Title,
            g.Description,
            g.Destination,
            g.CoverImageUrl,
            g.NumberOfDays,
            g.Mobility.ToString(),
            g.Season.ToString(),
            g.ForWho.ToString()
        ));

    return Results.Ok(result);
});

// Détail guide
app.MapGet("/api/guides/{id:int}", (HttpContext http, int id) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();

    var guide = db.Guides.FirstOrDefault(g => g.Id == id);
    if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

    if (!IsAdmin(current))
    {
        var invited = db.GuideInvitations.Any(i => i.UserId == current.Id && i.GuideId == id);
        if (!invited) return Results.Forbid();
    }

    var days = db.GuideDays
        .Where(d => d.GuideId == id)
        .OrderBy(d => d.DayNumber)
        .Select(d => new GuideDayResponse(
            d.Id,
            d.DayNumber,
            d.Title,
            d.Date?.ToString("yyyy-MM-dd"),
            db.Activities
                .Where(a => a.GuideDayId == d.Id)
                .OrderBy(a => a.VisitOrder)
                .Select(a => new ActivityResponse(
                    a.Id,
                    a.Title,
                    a.Description,
                    a.Category.ToString(),
                    a.Address,
                    a.PhoneNumber,
                    a.OpeningHours,
                    a.Website,
                    a.StartTime,
                    a.EndTime,
                    a.ForWho.ToString(),
                    a.VisitOrder
                ))
                .ToList()
        ))
        .ToList();

    var result = new GuideDetailResponse(
        guide.Id,
        guide.Title,
        guide.Description,
        guide.Destination,
        guide.CoverImageUrl,
        guide.NumberOfDays,
        guide.Mobility.ToString(),
        guide.Season.ToString(),
        guide.ForWho.ToString(),
        days
    );

    return Results.Ok(result);
});

// Créer guide (admin)
app.MapPost("/api/guides", (HttpContext http, CreateGuideRequest request) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
    {
        return Results.BadRequest(new { message = "Titre et description obligatoires." });
    }

    if (request.NumberOfDays < 1)
    {
        return Results.BadRequest(new { message = "Le nombre de jours doit être >= 1." });
    }

    if (!Enum.TryParse<Mobility>(request.Mobility, true, out var mobility))
    {
        return Results.BadRequest(new { message = "Mobilité invalide." });
    }

    if (!Enum.TryParse<Season>(request.Season, true, out var season))
    {
        return Results.BadRequest(new { message = "Saison invalide." });
    }

    if (!Enum.TryParse<ForWho>(request.ForWho, true, out var forWho))
    {
        return Results.BadRequest(new { message = "PourWho invalide." });
    }

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

    // Création automatique des jours
    for (int i = 1; i <= guide.NumberOfDays; i++)
    {
        db.GuideDays.Add(new GuideDay
        {
            Id = db.GuideDays.Any() ? db.GuideDays.Max(d => d.Id) + 1 : 1,
            GuideId = guide.Id,
            DayNumber = i,
            Title = $"Jour {i}",
            Date = null
        });
    }

    return Results.Created($"/api/guides/{guide.Id}", new { guide.Id });
});

// Modifier guide (admin)
app.MapPut("/api/guides/{id:int}", (HttpContext http, int id, UpdateGuideRequest request) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    var guide = db.Guides.FirstOrDefault(g => g.Id == id);
    if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

    if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
    {
        return Results.BadRequest(new { message = "Titre et description obligatoires." });
    }

    if (request.NumberOfDays < 1)
    {
        return Results.BadRequest(new { message = "Le nombre de jours doit être >= 1." });
    }

    if (!Enum.TryParse<Mobility>(request.Mobility, true, out var mobility))
    {
        return Results.BadRequest(new { message = "Mobilité invalide." });
    }

    if (!Enum.TryParse<Season>(request.Season, true, out var season))
    {
        return Results.BadRequest(new { message = "Saison invalide." });
    }

    if (!Enum.TryParse<ForWho>(request.ForWho, true, out var forWho))
    {
        return Results.BadRequest(new { message = "PourWho invalide." });
    }

    guide.Title = request.Title.Trim();
    guide.Description = request.Description.Trim();
    guide.Destination = request.Destination?.Trim();
    guide.CoverImageUrl = request.CoverImageUrl?.Trim();
    guide.Mobility = mobility;
    guide.Season = season;
    guide.ForWho = forWho;

    // Ajustement nombre de jours
    if (guide.NumberOfDays != request.NumberOfDays)
    {
        guide.NumberOfDays = request.NumberOfDays;

        var existingDays = db.GuideDays
            .Where(d => d.GuideId == guide.Id)
            .OrderBy(d => d.DayNumber)
            .ToList();

        if (existingDays.Count < request.NumberOfDays)
        {
            var start = existingDays.Count + 1;
            for (int i = start; i <= request.NumberOfDays; i++)
            {
                db.GuideDays.Add(new GuideDay
                {
                    Id = db.GuideDays.Any() ? db.GuideDays.Max(d => d.Id) + 1 : 1,
                    GuideId = guide.Id,
                    DayNumber = i,
                    Title = $"Jour {i}"
                });
            }
        }
        else if (existingDays.Count > request.NumberOfDays)
        {
            var toRemove = existingDays.Where(d => d.DayNumber > request.NumberOfDays).ToList();
            var toRemoveIds = toRemove.Select(d => d.Id).ToHashSet();

            db.Activities.RemoveAll(a => toRemoveIds.Contains(a.GuideDayId));
            db.GuideDays.RemoveAll(d => toRemoveIds.Contains(d.Id));
        }
    }

    return Results.Ok(new { message = "Guide modifié." });
});

// Supprimer guide (admin)
app.MapDelete("/api/guides/{id:int}", (HttpContext http, int id) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    var guide = db.Guides.FirstOrDefault(g => g.Id == id);
    if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

    var dayIds = db.GuideDays.Where(d => d.GuideId == id).Select(d => d.Id).ToHashSet();

    db.Activities.RemoveAll(a => dayIds.Contains(a.GuideDayId));
    db.GuideDays.RemoveAll(d => d.GuideId == id);
    db.GuideInvitations.RemoveAll(i => i.GuideId == id);
    db.Guides.Remove(guide);

    return Results.NoContent();
});

// Ajouter activité à un jour (admin)
app.MapPost("/api/guides/{guideId:int}/days/{dayId:int}/activities", (HttpContext http, int guideId, int dayId, CreateActivityRequest request) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    var guide = db.Guides.FirstOrDefault(g => g.Id == guideId);
    if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

    var day = db.GuideDays.FirstOrDefault(d => d.Id == dayId && d.GuideId == guideId);
    if (day is null) return Results.NotFound(new { message = "Jour introuvable pour ce guide." });

    if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
    {
        return Results.BadRequest(new { message = "Titre et description obligatoires." });
    }

    if (!Enum.TryParse<ActivityCategory>(request.Category, true, out var category))
    {
        return Results.BadRequest(new { message = "Catégorie invalide." });
    }

    if (!Enum.TryParse<ForWho>(request.ForWho, true, out var forWho))
    {
        return Results.BadRequest(new { message = "PourWho invalide." });
    }

    var nextOrder = db.Activities
        .Where(a => a.GuideDayId == dayId)
        .Select(a => a.VisitOrder)
        .DefaultIfEmpty(0)
        .Max() + 1;

    var activity = new Activity
    {
        Id = db.Activities.Any() ? db.Activities.Max(a => a.Id) + 1 : 1,
        GuideDayId = dayId,
        Title = request.Title.Trim(),
        Description = request.Description.Trim(),
        Category = category,
        Address = request.Address?.Trim() ?? "",
        PhoneNumber = request.PhoneNumber?.Trim(),
        OpeningHours = request.OpeningHours?.Trim(),
        Website = request.Website?.Trim(),
        StartTime = request.StartTime?.Trim(),
        EndTime = request.EndTime?.Trim(),
        ForWho = forWho,
        VisitOrder = request.VisitOrder ?? nextOrder
    };

    db.Activities.Add(activity);

    return Results.Created($"/api/guides/{guideId}", new { activity.Id });
});

// Inviter un user sur un guide (admin)
app.MapPost("/api/guides/{guideId:int}/invitations", (HttpContext http, int guideId, CreateInvitationRequest request) =>
{
    var current = GetCurrentUser(http);
    if (current is null) return Results.Unauthorized();
    if (!IsAdmin(current)) return Results.Forbid();

    var guide = db.Guides.FirstOrDefault(g => g.Id == guideId);
    if (guide is null) return Results.NotFound(new { message = "Guide introuvable." });

    var user = db.Users.FirstOrDefault(u => u.Id == request.UserId);
    if (user is null) return Results.NotFound(new { message = "Utilisateur introuvable." });

    if (db.GuideInvitations.Any(i => i.GuideId == guideId && i.UserId == request.UserId))
    {
        return Results.BadRequest(new { message = "Invitation déjà existante." });
    }

    db.GuideInvitations.Add(new GuideInvitation
    {
        GuideId = guideId,
        UserId = request.UserId
    });

    return Results.Ok(new { message = "Invitation ajoutée." });
});

app.Run();

/* ===================== MODELS ===================== */

enum UserRole
{
    Admin,
    User
}

enum Mobility
{
    Voiture,
    Velo,
    Pied,
    Moto
}

enum Season
{
    Ete,
    Printemps,
    Automne,
    Hiver
}

enum ForWho
{
    Famille,
    Seul,
    Groupe,
    EntreAmis
}

enum ActivityCategory
{
    Musee,
    Chateau,
    Activite,
    Parc,
    Grotte
}

class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public UserRole Role { get; set; }
}

class Guide
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public int NumberOfDays { get; set; }
    public string? Destination { get; set; }
    public string? CoverImageUrl { get; set; }
    public Mobility Mobility { get; set; }
    public Season Season { get; set; }
    public ForWho ForWho { get; set; }
    public int CreatedByUserId { get; set; }
}

class GuideDay
{
    public int Id { get; set; }
    public int GuideId { get; set; }
    public int DayNumber { get; set; }
    public string Title { get; set; } = "";
    public DateTime? Date { get; set; }
}

class Activity
{
    public int Id { get; set; }
    public int GuideDayId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public ActivityCategory Category { get; set; }
    public string Address { get; set; } = "";
    public string? PhoneNumber { get; set; }
    public string? OpeningHours { get; set; }
    public string? Website { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public ForWho ForWho { get; set; }
    public int VisitOrder { get; set; }
}

class GuideInvitation
{
    public int GuideId { get; set; }
    public int UserId { get; set; }
}

class AppDb
{
    public List<User> Users { get; set; } = new();
    public List<Guide> Guides { get; set; } = new();
    public List<GuideDay> GuideDays { get; set; } = new();
    public List<Activity> Activities { get; set; } = new();
    public List<GuideInvitation> GuideInvitations { get; set; } = new();
}

/* ===================== REQUESTS ===================== */

record CreateUserRequest(string Email, string Password, string Role);

record CreateGuideRequest(
    string Title,
    string Description,
    int NumberOfDays,
    string Mobility,
    string Season,
    string ForWho,
    string? Destination,
    string? CoverImageUrl
);

record UpdateGuideRequest(
    string Title,
    string Description,
    int NumberOfDays,
    string Mobility,
    string Season,
    string ForWho,
    string? Destination,
    string? CoverImageUrl
);

record CreateActivityRequest(
    string Title,
    string Description,
    string Category,
    string Address,
    string? PhoneNumber,
    string? OpeningHours,
    string? Website,
    string? StartTime,
    string? EndTime,
    string ForWho,
    int? VisitOrder
);

record CreateInvitationRequest(int UserId);

/* ===================== RESPONSES ===================== */

record UserResponse(int Id, string Email, string Role);

record GuideListItemResponse(
    int Id,
    string Title,
    string Description,
    string? Destination,
    string? CoverImageUrl,
    int DaysCount,
    string Mobility,
    string Season,
    string ForWho
);

record GuideDetailResponse(
    int Id,
    string Title,
    string Description,
    string? Destination,
    string? CoverImageUrl,
    int DaysCount,
    string Mobility,
    string Season,
    string ForWho,
    List<GuideDayResponse> Days
);

record GuideDayResponse(
    int Id,
    int DayNumber,
    string Title,
    string? Date,
    List<ActivityResponse> Activities
);

record ActivityResponse(
    int Id,
    string Title,
    string Description,
    string Category,
    string Address,
    string? PhoneNumber,
    string? OpeningHours,
    string? Website,
    string? StartTime,
    string? EndTime,
    string ForWho,
    int VisitOrder
);

/* ===================== SEED ===================== */

static class SeedData
{
    // Seed backend enrichi, remplace uniquement la méthode SeedData.Create() dans Program.cs
// en gardant tes modèles, endpoints et permissions tels quels.

public static AppDb Create()
{
    var db = new AppDb();

    db.Users.AddRange(new[]
    {
        new User { Id = 1, Email = "admin@henritrip.test", Password = "admin123", Role = UserRole.Admin },
        new User { Id = 2, Email = "alice@henritrip.test", Password = "alice123", Role = UserRole.User },
        new User { Id = 3, Email = "bob@henritrip.test", Password = "bob123", Role = UserRole.User }
    });

    db.Guides.AddRange(new[]
    {
        new Guide
        {
            Id = 1,
            Title = "Weekend à Paris",
            Description = "Itinéraire de 3 jours pour découvrir les incontournables de Paris, entre balades, musées et quartiers emblématiques.",
            NumberOfDays = 3,
            Destination = "Paris, France",
            CoverImageUrl = "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
            Mobility = Mobility.Pied,
            Season = Season.Printemps,
            ForWho = ForWho.EntreAmis,
            CreatedByUserId = 1
        },
        new Guide
        {
            Id = 2,
            Title = "Rome en 2 jours",
            Description = "Guide express pour explorer Rome sur un week-end, avec un parcours simple et des activités classées par jour.",
            NumberOfDays = 2,
            Destination = "Rome, Italie",
            CoverImageUrl = "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
            Mobility = Mobility.Pied,
            Season = Season.Ete,
            ForWho = ForWho.Groupe,
            CreatedByUserId = 1
        }
    });

    db.GuideDays.AddRange(new[]
    {
        new GuideDay { Id = 101, GuideId = 1, DayNumber = 1, Title = "Centre historique", Date = new DateTime(2025, 9, 1) },
        new GuideDay { Id = 102, GuideId = 1, DayNumber = 2, Title = "Musées et monuments", Date = new DateTime(2025, 9, 2) },
        new GuideDay { Id = 103, GuideId = 1, DayNumber = 3, Title = "Balade et détente", Date = new DateTime(2025, 9, 3) },

        new GuideDay { Id = 201, GuideId = 2, DayNumber = 1, Title = "Rome antique", Date = new DateTime(2025, 10, 5) },
        new GuideDay { Id = 202, GuideId = 2, DayNumber = 2, Title = "Vatican et centre", Date = new DateTime(2025, 10, 6) }
    });

    db.Activities.AddRange(new[]
    {
        // PARIS - JOUR 1
        new Activity
        {
            Id = 1001,
            GuideDayId = 101,
            Title = "Petit-déjeuner au café",
            Description = "Commencer la journée dans un café de quartier avant la visite du centre historique.",
            Category = ActivityCategory.Activite,
            Address = "Le Marais, Paris",
            PhoneNumber = "0102030405",
            OpeningHours = "08:00-11:00",
            Website = "https://example.com/cafe-paris",
            StartTime = "08:30",
            EndTime = "09:15",
            ForWho = ForWho.EntreAmis,
            VisitOrder = 1
        },
        new Activity
        {
            Id = 1002,
            GuideDayId = 101,
            Title = "Île de la Cité et Notre-Dame",
            Description = "Balade à pied autour de l’île de la Cité et découverte des points d’intérêt extérieurs.",
            Category = ActivityCategory.Activite,
            Address = "Île de la Cité, Paris",
            PhoneNumber = null,
            OpeningHours = "Accès libre",
            Website = "https://www.paris.fr",
            StartTime = "10:00",
            EndTime = "11:30",
            ForWho = ForWho.Groupe,
            VisitOrder = 2
        },
        new Activity
        {
            Id = 1003,
            GuideDayId = 101,
            Title = "Balade sur les quais de Seine",
            Description = "Parcours à pied le long des quais avec pauses photo et points de vue sur les monuments.",
            Category = ActivityCategory.Parc,
            Address = "Quais de Seine, Paris",
            PhoneNumber = null,
            OpeningHours = "Accès libre",
            Website = "https://en.parisinfo.com",
            StartTime = "12:00",
            EndTime = "13:00",
            ForWho = ForWho.EntreAmis,
            VisitOrder = 3
        },

        // PARIS - JOUR 2
        new Activity
        {
            Id = 1101,
            GuideDayId = 102,
            Title = "Musée du Louvre",
            Description = "Visite des salles principales et des œuvres incontournables. Réservation conseillée.",
            Category = ActivityCategory.Musee,
            Address = "Rue de Rivoli, Paris",
            PhoneNumber = "0140205050",
            OpeningHours = "09:00-18:00",
            Website = "https://www.louvre.fr",
            StartTime = "09:30",
            EndTime = "12:30",
            ForWho = ForWho.Groupe,
            VisitOrder = 1
        },
        new Activity
        {
            Id = 1102,
            GuideDayId = 102,
            Title = "Jardin des Tuileries",
            Description = "Pause et promenade entre deux visites dans un espace vert central.",
            Category = ActivityCategory.Parc,
            Address = "Place de la Concorde, Paris",
            PhoneNumber = null,
            OpeningHours = "07:00-21:00",
            Website = "https://www.louvre.fr/decouvrir/le-domaine-des-tuileries",
            StartTime = "12:45",
            EndTime = "13:30",
            ForWho = ForWho.Famille,
            VisitOrder = 2
        },
        new Activity
        {
            Id = 1103,
            GuideDayId = 102,
            Title = "Tour Eiffel (extérieur + Champ de Mars)",
            Description = "Découverte de la Tour Eiffel et promenade au Champ de Mars.",
            Category = ActivityCategory.Activite,
            Address = "Champ de Mars, Paris",
            PhoneNumber = null,
            OpeningHours = "Accès extérieur libre",
            Website = "https://www.toureiffel.paris",
            StartTime = "15:00",
            EndTime = "17:00",
            ForWho = ForWho.EntreAmis,
            VisitOrder = 3
        },

        // PARIS - JOUR 3
        new Activity
        {
            Id = 1201,
            GuideDayId = 103,
            Title = "Montmartre et Sacré-Cœur",
            Description = "Balade dans les ruelles de Montmartre et point de vue depuis la basilique.",
            Category = ActivityCategory.Activite,
            Address = "Montmartre, Paris",
            PhoneNumber = null,
            OpeningHours = "Accès quartier libre",
            Website = "https://www.paris.fr",
            StartTime = "10:00",
            EndTime = "12:00",
            ForWho = ForWho.Groupe,
            VisitOrder = 1
        },
        new Activity
        {
            Id = 1202,
            GuideDayId = 103,
            Title = "Parc des Buttes-Chaumont",
            Description = "Fin de séjour plus calme avec promenade dans un parc parisien.",
            Category = ActivityCategory.Parc,
            Address = "1 Rue Botzaris, Paris",
            PhoneNumber = null,
            OpeningHours = "07:00-22:00",
            Website = "https://www.paris.fr/lieux/parc-des-buttes-chaumont-1776",
            StartTime = "15:00",
            EndTime = "16:30",
            ForWho = ForWho.Famille,
            VisitOrder = 2
        },

        // ROME - JOUR 1
        new Activity
        {
            Id = 2001,
            GuideDayId = 201,
            Title = "Colisée",
            Description = "Visite du Colisée et découverte de l’histoire du site antique.",
            Category = ActivityCategory.Activite,
            Address = "Piazza del Colosseo, Rome",
            PhoneNumber = null,
            OpeningHours = "08:30-19:00",
            Website = "https://parcocolosseo.it",
            StartTime = "09:30",
            EndTime = "11:00",
            ForWho = ForWho.Famille,
            VisitOrder = 1
        },
        new Activity
        {
            Id = 2002,
            GuideDayId = 201,
            Title = "Forum Romain",
            Description = "Parcours à pied dans les ruines du Forum Romain, à proximité du Colisée.",
            Category = ActivityCategory.Activite,
            Address = "Via della Salara Vecchia, Rome",
            PhoneNumber = null,
            OpeningHours = "09:00-18:30",
            Website = "https://parcocolosseo.it",
            StartTime = "11:15",
            EndTime = "13:00",
            ForWho = ForWho.Groupe,
            VisitOrder = 2
        },
        new Activity
        {
            Id = 2003,
            GuideDayId = 201,
            Title = "Fontaine de Trevi",
            Description = "Pause dans le centre historique pour découvrir l’un des monuments les plus connus de Rome.",
            Category = ActivityCategory.Activite,
            Address = "Piazza di Trevi, Rome",
            PhoneNumber = null,
            OpeningHours = "Accès libre",
            Website = "https://www.turismoroma.it",
            StartTime = "16:00",
            EndTime = "16:45",
            ForWho = ForWho.EntreAmis,
            VisitOrder = 3
        },

        // ROME - JOUR 2
        new Activity
        {
            Id = 2101,
            GuideDayId = 202,
            Title = "Musées du Vatican",
            Description = "Visite des collections et de la Chapelle Sixtine. Réservation fortement conseillée.",
            Category = ActivityCategory.Musee,
            Address = "Viale Vaticano, Rome",
            PhoneNumber = null,
            OpeningHours = "08:00-19:00",
            Website = "https://www.museivaticani.va",
            StartTime = "09:00",
            EndTime = "12:00",
            ForWho = ForWho.Groupe,
            VisitOrder = 1
        },
        new Activity
        {
            Id = 2102,
            GuideDayId = 202,
            Title = "Place Saint-Pierre",
            Description = "Découverte de la place et de son architecture, juste après la visite des musées.",
            Category = ActivityCategory.Activite,
            Address = "Piazza San Pietro, Vatican",
            PhoneNumber = null,
            OpeningHours = "Accès libre",
            Website = "https://www.vatican.va",
            StartTime = "12:15",
            EndTime = "13:00",
            ForWho = ForWho.Famille,
            VisitOrder = 2
        },
        new Activity
        {
            Id = 2103,
            GuideDayId = 202,
            Title = "Balade Piazza Navona",
            Description = "Promenade de fin de journée dans le centre, avec places historiques et ambiance locale.",
            Category = ActivityCategory.Activite,
            Address = "Piazza Navona, Rome",
            PhoneNumber = null,
            OpeningHours = "Accès libre",
            Website = "https://www.turismoroma.it",
            StartTime = "17:00",
            EndTime = "18:00",
            ForWho = ForWho.EntreAmis,
            VisitOrder = 3
        }
    });

    db.GuideInvitations.AddRange(new[]
    {
        new GuideInvitation { GuideId = 1, UserId = 2 },
        new GuideInvitation { GuideId = 2, UserId = 2 },
        new GuideInvitation { GuideId = 2, UserId = 3 }
    });

    return db;
}
}