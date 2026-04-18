using IdentityService.Api.Data;
using IdentityService.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:8080");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
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
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "KITHU Salary Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Read DB connection from environment vars
var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "admin";
var dbPass = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "password";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "identity_db";
var connStr = $"Host={dbHost};Database={dbName};Username={dbUser};Password={dbPass}";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connStr));

builder.Services.AddScoped<IAuthService, AuthService>();

// Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// Method for manual DI in services if needed, but not used here.

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

// Ensure DB is created (Migration alternative for MVP)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        var sql = @"
            CREATE TABLE IF NOT EXISTS ""Users"" (
                ""Id"" uuid NOT NULL CONSTRAINT ""PK_Users"" PRIMARY KEY,
                ""Email"" text NOT NULL,
                ""PasswordHash"" text NOT NULL,
                ""Username"" text,
                ""CreatedAt"" timestamp with time zone NOT NULL
            );

            ALTER TABLE ""Users"" ALTER COLUMN ""Username"" DROP NOT NULL;

            CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Users_Email"" ON ""Users"" (""Email"");

            CREATE TABLE IF NOT EXISTS ""SalarySubmissions"" (
                ""Id"" uuid NOT NULL CONSTRAINT ""PK_SalarySubmissions"" PRIMARY KEY,
                ""Country"" text NOT NULL,
                ""Company"" text NOT NULL,
                ""Role"" text NOT NULL,
                ""ExperienceYears"" integer NOT NULL,
                ""Level"" text NOT NULL,
                ""SalaryAmount"" numeric NOT NULL,
                ""Currency"" text NOT NULL,
                ""Period"" text NOT NULL,
                ""IsAnonymous"" boolean NOT NULL,
                ""Status"" text NOT NULL,
                ""UserEmail"" text,
                ""SubmittedAt"" timestamp with time zone NOT NULL
            );";

        dbContext.Database.ExecuteSqlRaw(sql);
        Console.WriteLine("✅ DB initialized successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ DB Connection failed: {ex.Message}");
    }
}

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("\n----------------------------------------------------------------");
    Console.WriteLine("   🚀 KITHU Salary Service is running!");
    Console.WriteLine("   📄 Swagger UI: http://localhost:5002/swagger");
    Console.WriteLine("----------------------------------------------------------------\n");
});

app.Run();
