using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoteService.Api.Data;
using VoteService.Api.DTOs;
using VoteService.Api.Models;

namespace VoteService.Api.Controllers;

[ApiController]
[Route("api")]
public class VotesController : ControllerBase
{
    private const string Approved = "APPROVED";
    private const string Pending = "PENDING";

    private static readonly HashSet<string> AllowedReportStatuses =
    ["NEW", "IN_REVIEW", "ACTION_TAKEN", "DISMISSED"];

    private static readonly HashSet<string> AllowedModerationActions =
    ["NONE", "HIDE", "UNHIDE", "LOCK", "UNLOCK", "DELETE_SUBMISSION", "REVERT_APPROVAL"];

    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public VotesController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [Authorize]
    [HttpPost("votes")]
    public async Task<IActionResult> UpsertVote([FromBody] CreateVoteRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var normalizedVoteType = request.VoteType.Trim().ToUpperInvariant();
        if (normalizedVoteType is not ("UP" or "DOWN"))
        {
            return BadRequest(new { message = "VoteType must be UP or DOWN" });
        }

        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid token: missing user id claim" });
        }

        var submission = await _context.SalarySubmissions.FindAsync(request.SubmissionId);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found" });
        }

        if (submission.IsLocked)
        {
            return BadRequest(new { message = "Submission is locked for moderation" });
        }

        var existingVote = await _context.Votes
            .FirstOrDefaultAsync(v => v.SubmissionId == request.SubmissionId && v.UserId == userId.Value);

        if (existingVote == null)
        {
            _context.Votes.Add(new Vote
            {
                SubmissionId = request.SubmissionId,
                UserId = userId.Value,
                VoteType = normalizedVoteType,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existingVote.VoteType = normalizedVoteType;
            existingVote.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var summary = await UpdateSubmissionStatusAndBuildSummary(request.SubmissionId, normalizedVoteType);
        return Ok(summary);
    }

    [Authorize]
    [HttpDelete("votes/{submissionId:guid}")]
    public async Task<IActionResult> RemoveVote(Guid submissionId)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid token: missing user id claim" });
        }

        var submission = await _context.SalarySubmissions.FindAsync(submissionId);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found" });
        }

        if (submission.IsLocked)
        {
            return BadRequest(new { message = "Submission is locked for moderation" });
        }

        var vote = await _context.Votes
            .FirstOrDefaultAsync(v => v.SubmissionId == submissionId && v.UserId == userId.Value);

        if (vote == null)
        {
            return NotFound(new { message = "Vote not found" });
        }

        _context.Votes.Remove(vote);
        await _context.SaveChangesAsync();

        var summary = await UpdateSubmissionStatusAndBuildSummary(submissionId, null);
        return Ok(summary);
    }

    [AllowAnonymous]
    [HttpGet("votes/{submissionId:guid}/summary")]
    public async Task<IActionResult> GetSummary(Guid submissionId)
    {
        var submission = await _context.SalarySubmissions.FindAsync(submissionId);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found" });
        }

        var userId = GetUserId();
        var currentUserVote = userId == null
            ? null
            : await _context.Votes
                .Where(v => v.SubmissionId == submissionId && v.UserId == userId.Value)
                .Select(v => v.VoteType)
                .FirstOrDefaultAsync();

        var upvotes = await _context.Votes.CountAsync(v => v.SubmissionId == submissionId && v.VoteType == "UP");
        var downvotes = await _context.Votes.CountAsync(v => v.SubmissionId == submissionId && v.VoteType == "DOWN");
        var threshold = _configuration.GetValue<int?>("VoteSettings:ApprovalScoreThreshold") ?? 3;

        return Ok(new
        {
            submissionId,
            upvotes,
            downvotes,
            score = upvotes - downvotes,
            submissionStatus = submission.Status,
            currentUserVote,
            threshold,
            thresholdProgress = Math.Max(upvotes - downvotes, 0),
            submission.IsHidden,
            submission.IsLocked
        });
    }

    [Authorize]
    [HttpPost("reports")]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Invalid token: missing user id claim" });
        }

        var submission = await _context.SalarySubmissions.FindAsync(request.SubmissionId);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found" });
        }

        if (submission.IsLocked)
        {
            return BadRequest(new { message = "Submission is locked for moderation" });
        }

        _context.Reports.Add(new Report
        {
            SubmissionId = request.SubmissionId,
            UserId = userId.Value,
            Reason = request.Reason.Trim(),
            CreatedAt = DateTime.UtcNow,
            Status = "NEW"
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Report created" });
    }

    [Authorize]
    [HttpGet("reports")]
    public async Task<IActionResult> GetReports(
        [FromQuery] string? status,
        [FromQuery] string? reason,
        [FromQuery] string? q,
        [FromQuery] string sort = "latest",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (!IsAdminOrModerator())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only ADMIN or MODERATOR can access reports." });
        }

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var reports = await _context.Reports
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToUpperInvariant();
            reports = reports.Where(r => string.Equals(r.Status, normalized, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(reason))
        {
            var rs = reason.Trim();
            reports = reports.Where(r => r.Reason.Contains(rs, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (from != null)
        {
            reports = reports.Where(r => r.CreatedAt >= from.Value).ToList();
        }

        if (to != null)
        {
            reports = reports.Where(r => r.CreatedAt <= to.Value.AddDays(1).AddTicks(-1)).ToList();
        }

        var submissionIds = reports.Select(r => r.SubmissionId).Distinct().ToList();

        var submissions = await _context.SalarySubmissions
            .Where(s => submissionIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s);

        var downvoteCounts = await _context.Votes
            .Where(v => submissionIds.Contains(v.SubmissionId) && v.VoteType == "DOWN")
            .GroupBy(v => v.SubmissionId)
            .Select(g => new { SubmissionId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SubmissionId, x => x.Count);

        var reportCounts = reports
            .GroupBy(r => r.SubmissionId)
            .ToDictionary(g => g.Key, g => g.Count());

        var queryText = q?.Trim();
        if (!string.IsNullOrWhiteSpace(queryText))
        {
            reports = reports.Where(r =>
            {
                var idMatch = r.SubmissionId.ToString().Contains(queryText, StringComparison.OrdinalIgnoreCase);
                var reasonMatch = r.Reason.Contains(queryText, StringComparison.OrdinalIgnoreCase);

                submissions.TryGetValue(r.SubmissionId, out var sub);
                var companyMatch = sub?.Company?.Contains(queryText, StringComparison.OrdinalIgnoreCase) == true;
                var roleMatch = sub?.Role?.Contains(queryText, StringComparison.OrdinalIgnoreCase) == true;
                var countryMatch = sub?.Country?.Contains(queryText, StringComparison.OrdinalIgnoreCase) == true;
                return idMatch || reasonMatch || companyMatch || roleMatch || countryMatch;
            }).ToList();
        }

        var normalizedSort = sort.Trim().ToLowerInvariant();
        reports = normalizedSort switch
        {
            "most_reported" => reports
                .OrderByDescending(r => reportCounts.TryGetValue(r.SubmissionId, out var c) ? c : 0)
                .ThenByDescending(r => r.CreatedAt)
                .ToList(),
            "most_downvoted" => reports
                .OrderByDescending(r => downvoteCounts.TryGetValue(r.SubmissionId, out var c) ? c : 0)
                .ThenByDescending(r => r.CreatedAt)
                .ToList(),
            _ => reports.OrderByDescending(r => r.CreatedAt).ToList()
        };

        var total = reports.Count;
        var paged = reports
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r =>
            {
                submissions.TryGetValue(r.SubmissionId, out var sub);
                return new ReportListItemResponse(
                    r.Id,
                    r.SubmissionId,
                    r.UserId,
                    r.Reason,
                    r.CreatedAt,
                    sub?.Status ?? "UNKNOWN",
                    r.Status,
                    reportCounts.TryGetValue(r.SubmissionId, out var rc) ? rc : 0,
                    downvoteCounts.TryGetValue(r.SubmissionId, out var dc) ? dc : 0
                );
            })
            .ToList();

        return Ok(new ReportListResponse(paged, total, page, pageSize));
    }

    [Authorize]
    [HttpGet("reports/{reportId:guid}")]
    public async Task<IActionResult> GetReportDetail(Guid reportId)
    {
        if (!IsAdminOrModerator())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only ADMIN or MODERATOR can view report detail." });
        }

        var report = await _context.Reports.FindAsync(reportId);
        if (report == null)
        {
            return NotFound(new { message = "Report not found" });
        }

        var submission = await _context.SalarySubmissions.FindAsync(report.SubmissionId);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found" });
        }

        var upvotes = await _context.Votes.CountAsync(v => v.SubmissionId == submission.Id && v.VoteType == "UP");
        var downvotes = await _context.Votes.CountAsync(v => v.SubmissionId == submission.Id && v.VoteType == "DOWN");
        var threshold = _configuration.GetValue<int?>("VoteSettings:ApprovalScoreThreshold") ?? 3;

        var history = await _context.Reports
            .Where(r => r.SubmissionId == report.SubmissionId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReportHistoryItemResponse(r.Id, r.Reason, r.Status, r.CreatedAt, r.UserId))
            .ToListAsync();

        var response = new ReportDetailResponse(
            report.Id,
            report.SubmissionId,
            report.Status,
            report.Reason,
            report.InternalNote,
            report.ResolutionAction,
            report.CreatedAt,
            report.UserId,
            new
            {
                submission.Id,
                submission.Country,
                Company = submission.IsAnonymous ? "Anonymous" : submission.Company,
                submission.Role,
                submission.ExperienceYears,
                submission.Level,
                submission.SalaryAmount,
                submission.Currency,
                submission.Period,
                submission.Status,
                submission.IsAnonymous,
                submission.IsHidden,
                submission.IsLocked,
                submission.SubmittedAt
            },
            new
            {
                upvotes,
                downvotes,
                score = upvotes - downvotes,
                threshold,
                thresholdProgress = Math.Max(upvotes - downvotes, 0)
            },
            history
        );

        return Ok(response);
    }

    [Authorize]
    [HttpPatch("reports/{reportId:guid}/review")]
    public async Task<IActionResult> ReviewReport(Guid reportId, [FromBody] UpdateReportRequest request)
    {
        if (!IsAdminOrModerator())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only ADMIN or MODERATOR can review reports." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                message = "Invalid review payload",
                errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Invalid value" : e.ErrorMessage).ToArray()
                    )
            });
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new { message = "Status is required" });
        }

        var status = request.Status.Trim().ToUpperInvariant();
        var moderationAction = string.IsNullOrWhiteSpace(request.ModerationAction)
            ? "NONE"
            : request.ModerationAction.Trim().ToUpperInvariant();

        if (!AllowedReportStatuses.Contains(status))
        {
            return BadRequest(new { message = "Invalid report status" });
        }

        if (!AllowedModerationActions.Contains(moderationAction))
        {
            return BadRequest(new { message = "Invalid moderation action" });
        }

        var reviewerId = GetUserId();
        if (reviewerId == null)
        {
            return Unauthorized(new { message = "Invalid token: missing user id claim" });
        }

        var report = await _context.Reports.FindAsync(reportId);
        if (report == null)
        {
            return NotFound(new { message = "Report not found" });
        }

        var submission = await _context.SalarySubmissions.FindAsync(report.SubmissionId);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found" });
        }

        switch (moderationAction)
        {
            case "HIDE":
                submission.IsHidden = true;
                break;
            case "UNHIDE":
                submission.IsHidden = false;
                break;
            case "LOCK":
                submission.IsLocked = true;
                break;
            case "UNLOCK":
                submission.IsLocked = false;
                break;
            case "REVERT_APPROVAL":
                if (string.Equals(submission.Status, Approved, StringComparison.OrdinalIgnoreCase))
                {
                    submission.Status = Pending;
                }
                break;
            case "DELETE_SUBMISSION":
                var submissionId = submission.Id;
                var votes = await _context.Votes.Where(v => v.SubmissionId == submissionId).ToListAsync();
                if (votes.Count > 0)
                {
                    _context.Votes.RemoveRange(votes);
                }
                _context.SalarySubmissions.Remove(submission);
                break;
        }

        report.Status = status;
        report.InternalNote = string.IsNullOrWhiteSpace(request.InternalNote) ? null : request.InternalNote.Trim();
        report.ResolutionAction = moderationAction == "NONE" ? null : moderationAction;
        report.ReviewedByUserId = reviewerId.Value;
        report.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new UpdateReportResponse("Report updated", report.Id, report.Status, report.ResolutionAction));
    }

    [Authorize]
    [HttpDelete("reports/{reportId:guid}")]
    public async Task<IActionResult> DeleteReport(Guid reportId)
    {
        if (!IsAdminOrModerator())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only ADMIN or MODERATOR can delete reports." });
        }

        var report = await _context.Reports.FindAsync(reportId);
        if (report == null)
        {
            return NotFound(new { message = "Report not found" });
        }

        _context.Reports.Remove(report);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Report deleted" });
    }

    private Guid? GetUserId()
    {
        var claimValue = User.FindFirstValue("id") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claimValue, out var userId) ? userId : null;
    }

    private bool IsAdminOrModerator()
    {
        var roleValues = User.Claims
            .Where(c =>
                string.Equals(c.Type, "role", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(c.Type, ClaimTypes.Role, StringComparison.OrdinalIgnoreCase) ||
                c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
            .SelectMany(c => ParseRoleClaimValues(c.Value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return roleValues.Contains("ADMIN", StringComparer.OrdinalIgnoreCase) ||
               roleValues.Contains("MODERATOR", StringComparer.OrdinalIgnoreCase);
    }

    private static IEnumerable<string> ParseRoleClaimValues(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return Array.Empty<string>();
        }

        // Handles payload styles like:
        // "ADMIN", "ADMIN,MODERATOR", and ["ADMIN","MODERATOR"] serialized as a string.
        var cleaned = raw
            .Replace("[", string.Empty)
            .Replace("]", string.Empty)
            .Replace("\"", string.Empty);

        return cleaned
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => !string.IsNullOrWhiteSpace(x));
    }

    private async Task<VoteSummaryResponse> UpdateSubmissionStatusAndBuildSummary(Guid submissionId, string? currentUserVote)
    {
        var submission = await _context.SalarySubmissions.FindAsync(submissionId);
        if (submission == null)
        {
            throw new InvalidOperationException("Submission not found while updating status.");
        }

        var upvotes = await _context.Votes.CountAsync(v => v.SubmissionId == submissionId && v.VoteType == "UP");
        var downvotes = await _context.Votes.CountAsync(v => v.SubmissionId == submissionId && v.VoteType == "DOWN");
        var score = upvotes - downvotes;

        var threshold = _configuration.GetValue<int?>("VoteSettings:ApprovalScoreThreshold") ?? 3;
        var nextStatus = score >= threshold ? Approved : Pending;

        if (!string.Equals(submission.Status, nextStatus, StringComparison.OrdinalIgnoreCase))
        {
            submission.Status = nextStatus;
            await _context.SaveChangesAsync();
        }

        return new VoteSummaryResponse(
            submissionId,
            upvotes,
            downvotes,
            score,
            submission.Status,
            currentUserVote
        );
    }
}
