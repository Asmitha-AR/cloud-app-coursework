using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalaryService.Api.Data;
using SalaryService.Api.Models;

namespace SalaryService.Api.Controllers;

[ApiController]
[Route("api/salary")]
public class SalariesController : ControllerBase
{
    private readonly SalaryDbContext _context;

    public SalariesController(SalaryDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var salaries = await _context.SalarySubmissions
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return Ok(salaries);
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SalarySubmission submission)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        submission.Status = "PENDING";
        submission.SubmittedAt = DateTime.UtcNow;

        _context.SalarySubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Submitted (PENDING)" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var salary = await _context.SalarySubmissions.FindAsync(id);

        if (salary == null)
            return NotFound();

        var response = new
        {
            salary.Id,
            salary.Country,
            Company = salary.IsAnonymous ? "Anonymous" : salary.Company,
            salary.Role,
            salary.Level,
            salary.ExperienceYears,
            salary.SalaryAmount,
            salary.Currency,
            salary.Period,
            salary.IsAnonymous,
            salary.Status,
            salary.SubmittedAt
        };

        return Ok(response);
    }
}
