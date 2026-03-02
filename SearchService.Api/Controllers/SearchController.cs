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
    private readonly ILogger<SearchController> _logger;

    public SearchController(AppDbContext context, ILogger<SearchController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get available filter options (Public endpoint)
    /// Anonymous users see filters from APPROVED salaries only
    /// Authenticated users see filters from ALL salaries
    /// </summary>
    [HttpGet("filters")]
    public async Task<IActionResult> GetFilters()
    {
        try
        {
            var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
            
            var query = _context.SalarySubmissions.AsQueryable();
            
            // Anonymous users: Only show filters from approved salaries
            if (!isAuthenticated)
            {
                query = query.Where(s => s.Status == "APPROVED");
            }

            var filters = new FiltersResponse
            {
                Countries = await query.Select(s => s.Country).Distinct().OrderBy(c => c).ToListAsync(),
                Companies = await query
                    .Where(s => !s.IsAnonymous) // Only show non-anonymous companies
                    .Select(s => s.Company)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync(),
                Roles = await query.Select(s => s.Role).Distinct().OrderBy(r => r).ToListAsync(),
                Levels = await query
                    .Where(s => !string.IsNullOrEmpty(s.Level))
                    .Select(s => s.Level)
                    .Distinct()
                    .OrderBy(l => l)
                    .ToListAsync(),
                Currencies = await query.Select(s => s.Currency).Distinct().OrderBy(c => c).ToListAsync(),
                MinExperience = await query.AnyAsync() ? await query.MinAsync(s => s.ExperienceYears) : 0,
                MaxExperience = await query.AnyAsync() ? await query.MaxAsync(s => s.ExperienceYears) : 0
            };

            _logger.LogInformation("Filters requested - Authenticated: {IsAuth}, Countries: {Count}", 
                isAuthenticated, filters.Countries.Count);

            return Ok(filters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching filters");
            return StatusCode(500, new { message = "Error fetching filter options" });
        }
    }

    /// <summary>
    /// Search salaries with filters and pagination (Conditional endpoint)
    /// Anonymous users: Only see APPROVED salaries
    /// Authenticated users: See ALL salaries (PENDING, APPROVED, REJECTED)
    /// </summary>
    [HttpGet("salaries")]
    public async Task<IActionResult> SearchSalaries([FromQuery] SearchRequest request)
    {
        try
        {
            var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
            
            var query = _context.SalarySubmissions.AsQueryable();

            // ⭐ KEY AUTHENTICATION LOGIC
            if (!isAuthenticated)
            {
                // Anonymous users: Only approved salaries
                query = query.Where(s => s.Status == "APPROVED");
                _logger.LogInformation("Anonymous search request - showing APPROVED only");
            }
            else
            {
                // Authenticated users: All salaries
                _logger.LogInformation("Authenticated search request - showing ALL statuses");
                
                // Allow authenticated users to filter by status if they want
                if (!string.IsNullOrEmpty(request.Status))
                {
                    query = query.Where(s => s.Status == request.Status.ToUpperInvariant());
                }
            }

            // Apply filters
            if (!string.IsNullOrEmpty(request.Country))
                query = query.Where(s => s.Country == request.Country);

            if (!string.IsNullOrEmpty(request.Company))
                query = query.Where(s => s.Company == request.Company);

            if (!string.IsNullOrEmpty(request.Role))
                query = query.Where(s => s.Role == request.Role);

            if (!string.IsNullOrEmpty(request.Level))
                query = query.Where(s => s.Level == request.Level);

            if (request.MinExperience.HasValue)
                query = query.Where(s => s.ExperienceYears >= request.MinExperience.Value);

            if (request.MaxExperience.HasValue)
                query = query.Where(s => s.ExperienceYears <= request.MaxExperience.Value);

            if (!string.IsNullOrEmpty(request.Currency))
                query = query.Where(s => s.Currency == request.Currency);

            if (request.MinSalary.HasValue)
                query = query.Where(s => s.SalaryAmount >= request.MinSalary.Value);

            if (request.MaxSalary.HasValue)
                query = query.Where(s => s.SalaryAmount <= request.MaxSalary.Value);

            // Get total count before pagination
            var totalItems = await query.CountAsync();

            // Apply sorting
            query = request.SortBy.ToLowerInvariant() switch
            {
                "salaryamount" => request.SortOrder.ToLowerInvariant() == "asc" 
                    ? query.OrderBy(s => s.SalaryAmount) 
                    : query.OrderByDescending(s => s.SalaryAmount),
                "experienceyears" => request.SortOrder.ToLowerInvariant() == "asc"
                    ? query.OrderBy(s => s.ExperienceYears)
                    : query.OrderByDescending(s => s.ExperienceYears),
                "submittedat" => request.SortOrder.ToLowerInvariant() == "asc"
                    ? query.OrderBy(s => s.SubmittedAt)
                    : query.OrderByDescending(s => s.SubmittedAt),
                _ => query.OrderByDescending(s => s.SubmittedAt) // Default
            };

            // Apply pagination
            var pageSize = Math.Min(request.PageSize, 100); // Max 100 per page
            var skip = (request.Page - 1) * pageSize;
            
            var salaries = await query
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            // Map to DTOs and respect anonymity
            var dtos = salaries.Select(s => new SalarySubmissionDto
            {
                Id = s.Id,
                Country = s.Country,
                Company = s.IsAnonymous ? "Anonymous" : s.Company, // ⭐ Privacy protection
                Role = s.Role,
                Level = s.Level,
                ExperienceYears = s.ExperienceYears,
                SalaryAmount = s.SalaryAmount,
                Currency = s.Currency,
                Period = s.Period,
                IsAnonymous = s.IsAnonymous,
                Status = s.Status,
                SubmittedAt = s.SubmittedAt
            }).ToList();

            var response = new SearchResponse
            {
                Data = dtos,
                Pagination = new PaginationInfo
                {
                    CurrentPage = request.Page,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
                }
            };

            _logger.LogInformation("Search completed - Auth: {IsAuth}, Results: {Count}/{Total}", 
                isAuthenticated, dtos.Count, totalItems);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching salaries");
            return StatusCode(500, new { message = "Error searching salaries" });
        }
    }

    /// <summary>
    /// Get single salary by ID (Conditional endpoint)
    /// Anonymous users: Only if status is APPROVED
    /// Authenticated users: Any status
    /// </summary>
    [HttpGet("salaries/{id}")]
    public async Task<IActionResult> GetSalaryById(Guid id)
    {
        try
        {
            var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
            
            var salary = await _context.SalarySubmissions.FindAsync(id);

            if (salary == null)
            {
                return NotFound(new { message = "Salary submission not found" });
            }

            // ⭐ KEY AUTHORIZATION LOGIC
            if (!isAuthenticated && salary.Status != "APPROVED")
            {
                // Anonymous users cannot see non-approved salaries
                return NotFound(new { message = "Salary submission not found" });
            }

            var dto = new SalarySubmissionDto
            {
                Id = salary.Id,
                Country = salary.Country,
                Company = salary.IsAnonymous ? "Anonymous" : salary.Company, // ⭐ Privacy protection
                Role = salary.Role,
                Level = salary.Level,
                ExperienceYears = salary.ExperienceYears,
                SalaryAmount = salary.SalaryAmount,
                Currency = salary.Currency,
                Period = salary.Period,
                IsAnonymous = salary.IsAnonymous,
                Status = salary.Status,
                SubmittedAt = salary.SubmittedAt
            };

            _logger.LogInformation("Salary detail requested - ID: {Id}, Auth: {IsAuth}, Status: {Status}", 
                id, isAuthenticated, salary.Status);

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching salary by ID: {Id}", id);
            return StatusCode(500, new { message = "Error fetching salary details" });
        }
    }
}
