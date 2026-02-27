class AppDb
{
    public List<User> Users { get; set; } = new();
    public List<Guide> Guides { get; set; } = new();
    public List<GuideDay> GuideDays { get; set; } = new();
    public List<Activity> Activities { get; set; } = new();
    public List<GuideInvitation> GuideInvitations { get; set; } = new();
}
