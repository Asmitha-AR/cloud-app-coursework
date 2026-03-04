using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SearchService.Api.Models;

[Table("SalarySubmissions")]
public class SalarySubmission
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public string Country { get; set; } = string.Empty;

    [Required]
    public string Company { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    public int ExperienceYears { get; set; }

    [Required]
    public string Level { get; set; } = string.Empty;

    [Required]
    public decimal SalaryAmount { get; set; }

    [Required]
    public string Currency { get; set; } = "USD";

    [Required]
    public string Period { get; set; } = "Yearly";

    public bool IsAnonymous { get; set; } = true;

    [Required]
    public string Status { get; set; } = "PENDING";

    public DateTime SubmittedAt { get; set; }
}
