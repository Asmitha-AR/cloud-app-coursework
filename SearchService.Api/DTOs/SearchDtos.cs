namespace SearchService.Api.DTOs;

public class SearchQueryRequest
{
    public string? Q { get; set; }
    public string? Country { get; set; }
    public string? Company { get; set; }
    public string? Role { get; set; }
    public string? Level { get; set; }
    public string? Currency { get; set; }
    public string? Period { get; set; }
    public int? MinExperienceYears { get; set; }
    public int? MaxExperienceYears { get; set; }
    public decimal? MinSalaryAmount { get; set; }
    public decimal? MaxSalaryAmount { get; set; }
    public string? SortBy { get; set; } = "submittedAt";
    public string? SortOrder { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public record SearchSalaryItem(
    Guid Id,
    string Country,
    string Company,
    string Role,
    string Level,
    int ExperienceYears,
    decimal SalaryAmount,
    string Currency,
    string Period,
    bool IsAnonymous,
    string Status,
    DateTime SubmittedAt
);

public record SearchResponse(
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    IReadOnlyList<SearchSalaryItem> Items
);
