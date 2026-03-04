using StatsService.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace StatsService.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<SalarySubmission> SalarySubmissions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SalarySubmission>()
            .HasKey(s => s.Id);
    }
}
