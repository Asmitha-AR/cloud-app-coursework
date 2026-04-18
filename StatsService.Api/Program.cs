using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using StatsService.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:8080");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Pravini Stats Service", Version = "v1" });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "admin";
var dbPass = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "password";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "identity_db";
var connStr = $"Host={dbHost};Database={dbName};Username={dbUser};Password={dbPass}";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connStr));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("frontend");

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("\n----------------------------------------------------------------");
    Console.WriteLine("   📊 Pravini Stats Service is running!");
    Console.WriteLine("   📄 Swagger UI: http://localhost:5004/swagger");
    Console.WriteLine("----------------------------------------------------------------\n");
});

app.Run();
