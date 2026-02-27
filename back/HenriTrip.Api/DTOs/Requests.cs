record LoginRequest(string Email, string Password);

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

record UpdateGuideDayRequest(
    string Title,
    string? Date
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

record UpdateActivityRequest(
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

record MoveActivityRequest(
    int TargetDayId,
    int? VisitOrder
);

record CreateInvitationRequest(int UserId);
