using Microsoft.EntityFrameworkCore;
using SearchService.Api.Models;

namespace SearchService.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<SalarySubmission> SalarySubmissions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SalarySubmission>()
            .HasKey(s => s.Id);

        modelBuilder.Entity<SalarySubmission>()
            .HasIndex(s => s.Status);

        modelBuilder.Entity<SalarySubmission>()
            .HasIndex(s => new { s.Country, s.Role, s.Level });

        modelBuilder.Entity<SalarySubmission>()
            .HasIndex(s => s.SubmittedAt);
    }
}
