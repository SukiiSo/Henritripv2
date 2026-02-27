static class SeedData
{
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
            new Activity
            {
                Id = 1001, GuideDayId = 101, Title = "Petit-déjeuner au café",
                Description = "Commencer la journée dans un café de quartier avant la visite du centre historique.",
                Category = ActivityCategory.Activite, Address = "Le Marais, Paris",
                PhoneNumber = "0102030405", OpeningHours = "08:00-11:00",
                Website = "https://example.com/cafe-paris", StartTime = "08:30", EndTime = "09:15",
                ForWho = ForWho.EntreAmis, VisitOrder = 1
            },
            new Activity
            {
                Id = 1002, GuideDayId = 101, Title = "Île de la Cité et Notre-Dame",
                Description = "Balade à pied autour de l'île de la Cité et découverte des points d'intérêt extérieurs.",
                Category = ActivityCategory.Activite, Address = "Île de la Cité, Paris",
                OpeningHours = "Accès libre", Website = "https://www.paris.fr",
                StartTime = "10:00", EndTime = "11:30", ForWho = ForWho.Groupe, VisitOrder = 2
            },
            new Activity
            {
                Id = 1003, GuideDayId = 101, Title = "Balade sur les quais de Seine",
                Description = "Parcours à pied le long des quais avec pauses photo et points de vue sur les monuments.",
                Category = ActivityCategory.Parc, Address = "Quais de Seine, Paris",
                OpeningHours = "Accès libre", Website = "https://en.parisinfo.com",
                StartTime = "12:00", EndTime = "13:00", ForWho = ForWho.EntreAmis, VisitOrder = 3
            },
            new Activity
            {
                Id = 1101, GuideDayId = 102, Title = "Musée du Louvre",
                Description = "Visite des salles principales et des œuvres incontournables. Réservation conseillée.",
                Category = ActivityCategory.Musee, Address = "Rue de Rivoli, Paris",
                PhoneNumber = "0140205050", OpeningHours = "09:00-18:00",
                Website = "https://www.louvre.fr", StartTime = "09:30", EndTime = "12:30",
                ForWho = ForWho.Groupe, VisitOrder = 1
            },
            new Activity
            {
                Id = 1102, GuideDayId = 102, Title = "Jardin des Tuileries",
                Description = "Pause et promenade entre deux visites dans un espace vert central.",
                Category = ActivityCategory.Parc, Address = "Place de la Concorde, Paris",
                OpeningHours = "07:00-21:00",
                Website = "https://www.louvre.fr/decouvrir/le-domaine-des-tuileries",
                StartTime = "12:45", EndTime = "13:30", ForWho = ForWho.Famille, VisitOrder = 2
            },
            new Activity
            {
                Id = 1103, GuideDayId = 102, Title = "Tour Eiffel (extérieur + Champ de Mars)",
                Description = "Découverte de la Tour Eiffel et promenade au Champ de Mars.",
                Category = ActivityCategory.Activite, Address = "Champ de Mars, Paris",
                OpeningHours = "Accès extérieur libre", Website = "https://www.toureiffel.paris",
                StartTime = "15:00", EndTime = "17:00", ForWho = ForWho.EntreAmis, VisitOrder = 3
            },
            new Activity
            {
                Id = 1201, GuideDayId = 103, Title = "Montmartre et Sacré-Cœur",
                Description = "Balade dans les ruelles de Montmartre et point de vue depuis la basilique.",
                Category = ActivityCategory.Activite, Address = "Montmartre, Paris",
                OpeningHours = "Accès quartier libre", Website = "https://www.paris.fr",
                StartTime = "10:00", EndTime = "12:00", ForWho = ForWho.Groupe, VisitOrder = 1
            },
            new Activity
            {
                Id = 1202, GuideDayId = 103, Title = "Parc des Buttes-Chaumont",
                Description = "Fin de séjour plus calme avec promenade dans un parc parisien.",
                Category = ActivityCategory.Parc, Address = "1 Rue Botzaris, Paris",
                OpeningHours = "07:00-22:00",
                Website = "https://www.paris.fr/lieux/parc-des-buttes-chaumont-1776",
                StartTime = "15:00", EndTime = "16:30", ForWho = ForWho.Famille, VisitOrder = 2
            },
            new Activity
            {
                Id = 2001, GuideDayId = 201, Title = "Colisée",
                Description = "Visite du Colisée et découverte de l'histoire du site antique.",
                Category = ActivityCategory.Activite, Address = "Piazza del Colosseo, Rome",
                OpeningHours = "08:30-19:00", Website = "https://parcocolosseo.it",
                StartTime = "09:30", EndTime = "11:00", ForWho = ForWho.Famille, VisitOrder = 1
            },
            new Activity
            {
                Id = 2002, GuideDayId = 201, Title = "Forum Romain",
                Description = "Parcours à pied dans les ruines du Forum Romain, à proximité du Colisée.",
                Category = ActivityCategory.Activite, Address = "Via della Salara Vecchia, Rome",
                OpeningHours = "09:00-18:30", Website = "https://parcocolosseo.it",
                StartTime = "11:15", EndTime = "13:00", ForWho = ForWho.Groupe, VisitOrder = 2
            },
            new Activity
            {
                Id = 2003, GuideDayId = 201, Title = "Fontaine de Trevi",
                Description = "Pause dans le centre historique pour découvrir l'un des monuments les plus connus de Rome.",
                Category = ActivityCategory.Activite, Address = "Piazza di Trevi, Rome",
                OpeningHours = "Accès libre", Website = "https://www.turismoroma.it",
                StartTime = "16:00", EndTime = "16:45", ForWho = ForWho.EntreAmis, VisitOrder = 3
            },
            new Activity
            {
                Id = 2101, GuideDayId = 202, Title = "Musées du Vatican",
                Description = "Visite des collections et de la Chapelle Sixtine. Réservation fortement conseillée.",
                Category = ActivityCategory.Musee, Address = "Viale Vaticano, Rome",
                OpeningHours = "08:00-19:00", Website = "https://www.museivaticani.va",
                StartTime = "09:00", EndTime = "12:00", ForWho = ForWho.Groupe, VisitOrder = 1
            },
            new Activity
            {
                Id = 2102, GuideDayId = 202, Title = "Place Saint-Pierre",
                Description = "Découverte de la place et de son architecture, juste après la visite des musées.",
                Category = ActivityCategory.Activite, Address = "Piazza San Pietro, Vatican",
                OpeningHours = "Accès libre", Website = "https://www.vatican.va",
                StartTime = "12:15", EndTime = "13:00", ForWho = ForWho.Famille, VisitOrder = 2
            },
            new Activity
            {
                Id = 2103, GuideDayId = 202, Title = "Balade Piazza Navona",
                Description = "Promenade de fin de journée dans le centre, avec places historiques et ambiance locale.",
                Category = ActivityCategory.Activite, Address = "Piazza Navona, Rome",
                OpeningHours = "Accès libre", Website = "https://www.turismoroma.it",
                StartTime = "17:00", EndTime = "18:00", ForWho = ForWho.EntreAmis, VisitOrder = 3
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
