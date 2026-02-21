using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoteService.Api.Models;

[Table("Reports", Schema = "community")]
public class Report
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SubmissionId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(32)]
    public string Status { get; set; } = "NEW"; // NEW, IN_REVIEW, ACTION_TAKEN, DISMISSED

    [MaxLength(1000)]
    public string? InternalNote { get; set; }

    [MaxLength(64)]
    public string? ResolutionAction { get; set; }

    public Guid? ReviewedByUserId { get; set; }

    public DateTime? ReviewedAt { get; set; }
}
