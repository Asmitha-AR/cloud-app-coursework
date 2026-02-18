using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VoteService.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5002");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Asmitha Vote Service", Version = "v1" });
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
            Array.Empty<string>()
        }
    });
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
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("frontend");

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        var sql = @"
            CREATE SCHEMA IF NOT EXISTS community;

            CREATE TABLE IF NOT EXISTS community.""Votes"" (
                ""Id"" uuid NOT NULL CONSTRAINT ""PK_Votes"" PRIMARY KEY,
                ""SubmissionId"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""VoteType"" text NOT NULL,
                ""CreatedAt"" timestamp with time zone NOT NULL,
                ""UpdatedAt"" timestamp with time zone NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Votes_SubmissionId_UserId""
                ON community.""Votes"" (""SubmissionId"", ""UserId"");

            CREATE INDEX IF NOT EXISTS ""IX_Votes_SubmissionId""
                ON community.""Votes"" (""SubmissionId"");

            CREATE TABLE IF NOT EXISTS community.""Reports"" (
                ""Id"" uuid NOT NULL CONSTRAINT ""PK_Reports"" PRIMARY KEY,
                ""SubmissionId"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""Reason"" text NOT NULL,
                ""CreatedAt"" timestamp with time zone NOT NULL,
                ""Status"" text NOT NULL DEFAULT 'NEW',
                ""InternalNote"" text NULL,
                ""ResolutionAction"" text NULL,
                ""ReviewedByUserId"" uuid NULL,
                ""ReviewedAt"" timestamp with time zone NULL
            );

            CREATE INDEX IF NOT EXISTS ""IX_Reports_SubmissionId""
                ON community.""Reports"" (""SubmissionId"");

            ALTER TABLE community.""Reports"" ADD COLUMN IF NOT EXISTS ""Status"" text NOT NULL DEFAULT 'NEW';
            ALTER TABLE community.""Reports"" ADD COLUMN IF NOT EXISTS ""InternalNote"" text NULL;
            ALTER TABLE community.""Reports"" ADD COLUMN IF NOT EXISTS ""ResolutionAction"" text NULL;
            ALTER TABLE community.""Reports"" ADD COLUMN IF NOT EXISTS ""ReviewedByUserId"" uuid NULL;
            ALTER TABLE community.""Reports"" ADD COLUMN IF NOT EXISTS ""ReviewedAt"" timestamp with time zone NULL;

            ALTER TABLE IF EXISTS ""SalarySubmissions"" ADD COLUMN IF NOT EXISTS ""IsHidden"" boolean NOT NULL DEFAULT false;
            ALTER TABLE IF EXISTS ""SalarySubmissions"" ADD COLUMN IF NOT EXISTS ""IsLocked"" boolean NOT NULL DEFAULT false;";

        dbContext.Database.ExecuteSqlRaw(sql);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Vote DB initialization failed: {ex.Message}");
    }
}

app.MapControllers();

app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("\n----------------------------------------------------------------");
    Console.WriteLine("   Asmitha Vote Service is running!");
    Console.WriteLine("   Swagger UI: http://localhost:5002/swagger");
    Console.WriteLine("----------------------------------------------------------------\n");
});

app.Run();
