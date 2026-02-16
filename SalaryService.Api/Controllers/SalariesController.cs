using IdentityService.Api.Data;
using IdentityService.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace IdentityService.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalariesController : ControllerBase
{
    private readonly AppDbContext _context;

    public SalariesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize]
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
        {
            return BadRequest(ModelState);
        }

        // Force status to PENDING regardless of what the user sends
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
        if (salary == null) return NotFound();

        // Respect anonymity
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