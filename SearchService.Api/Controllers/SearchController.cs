using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SearchService.Api.Data;
using SearchService.Api.DTOs;

namespace SearchService.Api.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _context;

    public SearchController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("salaries")]
    public async Task<IActionResult> SearchSalaries([FromQuery] SearchQueryRequest request)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 20 : Math.Min(request.PageSize, 100);

        // Check if user is authenticated
        var isAuthenticated = User.Identity?.IsAuthenticated ?? false;

        var query = _context.SalarySubmissions.AsNoTracking();

        // Anonymous users: Only show APPROVED salaries
        // Authenticated users: Show ALL salaries (PENDING, APPROVED, REJECTED)
        if (!isAuthenticated)
        {
            query = query.Where(s => s.Status == "APPROVED");
        }

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var pattern = $"%{request.Q.Trim()}%";
            query = query.Where(s =>
                EF.Functions.ILike(s.Country, pattern) ||
                EF.Functions.ILike(s.Company, pattern) ||
                EF.Functions.ILike(s.Role, pattern) ||
                EF.Functions.ILike(s.Level, pattern));
        }

        if (!string.IsNullOrWhiteSpace(request.Country))
            query = query.Where(s => EF.Functions.ILike(s.Country, request.Country.Trim()));

        if (!string.IsNullOrWhiteSpace(request.Company))
            query = query.Where(s => EF.Functions.ILike(s.Company, request.Company.Trim()));

        if (!string.IsNullOrWhiteSpace(request.Role))
            query = query.Where(s => EF.Functions.ILike(s.Role, request.Role.Trim()));

        if (!string.IsNullOrWhiteSpace(request.Level))
            query = query.Where(s => EF.Functions.ILike(s.Level, request.Level.Trim()));

        if (!string.IsNullOrWhiteSpace(request.Currency))
            query = query.Where(s => EF.Functions.ILike(s.Currency, request.Currency.Trim()));

        if (!string.IsNullOrWhiteSpace(request.Period))
            query = query.Where(s => EF.Functions.ILike(s.Period, request.Period.Trim()));

        if (request.MinExperienceYears.HasValue)
            query = query.Where(s => s.ExperienceYears >= request.MinExperienceYears.Value);

        if (request.MaxExperienceYears.HasValue)
            query = query.Where(s => s.ExperienceYears <= request.MaxExperienceYears.Value);

        if (request.MinSalaryAmount.HasValue)
            query = query.Where(s => s.SalaryAmount >= request.MinSalaryAmount.Value);

        if (request.MaxSalaryAmount.HasValue)
            query = query.Where(s => s.SalaryAmount <= request.MaxSalaryAmount.Value);

        var sortBy = request.SortBy?.Trim().ToLowerInvariant();
        var desc = !string.Equals(request.SortOrder, "asc", StringComparison.OrdinalIgnoreCase);

        query = (sortBy, desc) switch
        {
            ("salaryamount", true) => query.OrderByDescending(s => s.SalaryAmount),
            ("salaryamount", false) => query.OrderBy(s => s.SalaryAmount),
            ("experienceyears", true) => query.OrderByDescending(s => s.ExperienceYears),
            ("experienceyears", false) => query.OrderBy(s => s.ExperienceYears),
            ("submittedat", false) => query.OrderBy(s => s.SubmittedAt),
            _ => query.OrderByDescending(s => s.SubmittedAt)
        };

        var totalCount = await query.CountAsync();
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SearchSalaryItem(
                s.Id,
                s.Country,
                s.IsAnonymous ? "Anonymous" : s.Company,
                s.Role,
                s.Level,
                s.ExperienceYears,
                s.SalaryAmount,
                s.Currency,
                s.Period,
                s.IsAnonymous,
                s.Status,
                s.SubmittedAt
            ))
            .ToListAsync();

        return Ok(new SearchResponse(
            page,
            pageSize,
            totalCount,
            totalPages,
            items
        ));
    }
}
