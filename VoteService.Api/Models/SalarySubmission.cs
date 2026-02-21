using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoteService.Api.Models;

[Table("SalarySubmissions")]
public class SalarySubmission
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public string Status { get; set; } = "PENDING";

    public string? Country { get; set; }
    public string? Company { get; set; }
    public string? Role { get; set; }
    public int ExperienceYears { get; set; }
    public string? Level { get; set; }
    public decimal SalaryAmount { get; set; }
    public string? Currency { get; set; }
    public string? Period { get; set; }
    public bool IsAnonymous { get; set; } = true;
    public DateTime SubmittedAt { get; set; }

    public bool IsHidden { get; set; } = false;
    public bool IsLocked { get; set; } = false;
}
