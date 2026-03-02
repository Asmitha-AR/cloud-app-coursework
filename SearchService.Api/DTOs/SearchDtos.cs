namespace SearchService.Api.DTOs;

public class SearchRequest
{
    public string? Country { get; set; }
    public string? Company { get; set; }
    public string? Role { get; set; }
    public string? Level { get; set; }
    public int? MinExperience { get; set; }
    public int? MaxExperience { get; set; }
    public string? Currency { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string? Status { get; set; } // For authenticated users only
    public string SortBy { get; set; } = "submittedAt"; // submittedAt, salaryAmount, experienceYears
    public string SortOrder { get; set; } = "desc"; // asc, desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SearchResponse
{
    public List<SalarySubmissionDto> Data { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

public class SalarySubmissionDto
{
    public Guid Id { get; set; }
    public string Country { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public decimal SalaryAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}

public class PaginationInfo
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public class FiltersResponse
{
    public List<string> Countries { get; set; } = new();
    public List<string> Companies { get; set; } = new();
    public List<string> Roles { get; set; } = new();
    public List<string> Levels { get; set; } = new();
    public List<string> Currencies { get; set; } = new();
    public int MinExperience { get; set; }
    public int MaxExperience { get; set; }
}
