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
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("front");

var db = SeedData.Create();
var sessions = new Dictionary<string, int>();

app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapAuthEndpoints(db, sessions);
app.MapUserEndpoints(db, sessions);
app.MapGuideEndpoints(db, sessions);

app.Run();
