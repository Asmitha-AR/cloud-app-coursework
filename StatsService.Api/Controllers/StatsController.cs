using StatsService.Api.Data;
using StatsService.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace StatsService.Api.Controllers;

[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StatsController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/stats/summary
    // Optional filters: ?country=Sri Lanka&role=Software Engineer
    // No login required — returns aggregated numbers only, no user/email data
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string? country,
        [FromQuery] string? role)
    {
        var query = _context.SalarySubmissions
            .Where(s => s.Status == "APPROVED");

        if (!string.IsNullOrEmpty(country))
            query = query.Where(s => s.Country == country);

        if (!string.IsNullOrEmpty(role))
            query = query.Where(s => s.Role == role);

        var salaries = await query
            .Select(s => (double)s.SalaryAmount)
            .ToListAsync();

        if (salaries.Count == 0)
            return Ok(new SummaryResponse(
                Count:   0,
                Average: 0,
                Median:  0,
                P25:     0,
                P75:     0
            ));

        salaries.Sort();

        return Ok(new SummaryResponse(
            Count:   salaries.Count,
            Average: Math.Round(salaries.Average(), 2),
            Median:  Math.Round(GetPercentile(salaries, 50), 2),
            P25:     Math.Round(GetPercentile(salaries, 25), 2),
            P75:     Math.Round(GetPercentile(salaries, 75), 2)
        ));
    }

    private static double GetPercentile(List<double> sortedData, double percentile)
    {
        if (sortedData.Count == 0) return 0;
        if (percentile <= 0)       return sortedData[0];
        if (percentile >= 100)     return sortedData[^1];

        double position   = (sortedData.Count - 1) * (percentile / 100.0);
        int    lowerIndex = (int)Math.Floor(position);
        double fraction   = position - lowerIndex;

        if (lowerIndex + 1 < sortedData.Count)
            return sortedData[lowerIndex] + (sortedData[lowerIndex + 1] - sortedData[lowerIndex]) * fraction;

        return sortedData[lowerIndex];
    }
}
