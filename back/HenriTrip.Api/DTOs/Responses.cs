record LoginResponse(string Token, UserResponse User);

record UserResponse(int Id, string Email, string Role);

record GuideInvitationResponse(int GuideId, int UserId, string Email, string Role);

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
    List<GuideDayResponse> Days,
    List<int> InvitedUserIds
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
