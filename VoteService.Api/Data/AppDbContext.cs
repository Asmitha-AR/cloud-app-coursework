using Microsoft.EntityFrameworkCore;
using VoteService.Api.Models;

namespace VoteService.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Vote> Votes { get; set; }
    public DbSet<Report> Reports { get; set; }
    public DbSet<SalarySubmission> SalarySubmissions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Vote>()
            .HasIndex(v => new { v.SubmissionId, v.UserId })
            .IsUnique();

        modelBuilder.Entity<Vote>()
            .HasIndex(v => v.SubmissionId);

        modelBuilder.Entity<Report>()
            .HasIndex(r => r.SubmissionId);

        modelBuilder.Entity<SalarySubmission>()
            .ToTable("SalarySubmissions");
    }
}
