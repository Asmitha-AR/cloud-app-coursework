using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SearchService.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5020");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Search Service", Version = "v1" });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("frontend");

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("\n----------------------------------------------------------------");
    Console.WriteLine("   Search Service is running!");
    Console.WriteLine("   Swagger UI: http://localhost:5020/swagger");
    Console.WriteLine("----------------------------------------------------------------\n");
});

app.Run();
