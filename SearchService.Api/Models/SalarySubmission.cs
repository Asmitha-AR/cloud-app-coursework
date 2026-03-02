using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace SearchService.Api.Models;

[Table("SalarySubmissions")]
[Index(nameof(Status))]
[Index(nameof(Country))]
[Index(nameof(Company))]
[Index(nameof(Role))]
[Index(nameof(SubmittedAt))]
public class SalarySubmission
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Country { get; set; } = string.Empty;

    [Required]
    public string Company { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    public string Level { get; set; } = string.Empty; // e.g. Junior, Senior, Staff

    public int ExperienceYears { get; set; }

    [Required]
    public decimal SalaryAmount { get; set; }

    [Required]
    public string Currency { get; set; } = "USD";

    [Required]
    public string Period { get; set; } = "Yearly"; // Monthly, Yearly

    public bool IsAnonymous { get; set; } = true;

    public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED

    public string? UserEmail { get; set; } // Optional: Email of the submitter

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
