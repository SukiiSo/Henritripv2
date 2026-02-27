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
