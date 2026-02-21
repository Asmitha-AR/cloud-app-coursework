using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoteService.Api.Models;

[Table("Votes", Schema = "community")]
public class Vote
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SubmissionId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(8)]
    public string VoteType { get; set; } = "UP"; // UP, DOWN

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
