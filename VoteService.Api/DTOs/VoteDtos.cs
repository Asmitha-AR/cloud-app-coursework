using System.ComponentModel.DataAnnotations;

namespace VoteService.Api.DTOs;

public record CreateVoteRequest(
    [Required] Guid SubmissionId,
    [Required] string VoteType
);

public record VoteSummaryResponse(
    Guid SubmissionId,
    int Upvotes,
    int Downvotes,
    int Score,
    string SubmissionStatus,
    string? CurrentUserVote
);

public record CreateReportRequest(
    [Required] Guid SubmissionId,
    [Required] string Reason
);

public record ReportListItemResponse(
    Guid Id,
    Guid SubmissionId,
    Guid UserId,
    string Reason,
    DateTime CreatedAt,
    string SubmissionStatus,
    string ReportStatus,
    int ReportsForSubmission,
    int DownvotesForSubmission
);

public record ReportListResponse(
    IReadOnlyList<ReportListItemResponse> Items,
    int Total,
    int Page,
    int PageSize
);

public record ReportHistoryItemResponse(
    Guid ReportId,
    string Reason,
    string Status,
    DateTime CreatedAt,
    Guid UserId
);

public record ReportDetailResponse(
    Guid ReportId,
    Guid SubmissionId,
    string ReportStatus,
    string Reason,
    string? InternalNote,
    string? ResolutionAction,
    DateTime CreatedAt,
    Guid UserId,
    object Submission,
    object VoteSummary,
    IReadOnlyList<ReportHistoryItemResponse> ReportHistory
);

public record UpdateReportRequest(
    [Required] string Status,
    string? InternalNote,
    string? ModerationAction
);

public record UpdateReportResponse(
    string Message,
    Guid ReportId,
    string Status,
    string? ModerationAction
);
