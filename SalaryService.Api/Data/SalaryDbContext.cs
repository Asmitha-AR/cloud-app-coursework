using Microsoft.EntityFrameworkCore;
using SalaryService.Api.Models;

namespace SalaryService.Api.Data;

public class SalaryDbContext : DbContext
{
    public SalaryDbContext(DbContextOptions<SalaryDbContext> options)
        : base(options)
    {
    }

    public DbSet<SalarySubmission> SalarySubmissions { get; set; }
    public DbSet<User> Users { get; set; }
}
