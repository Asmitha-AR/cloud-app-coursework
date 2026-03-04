namespace StatsService.Api.DTOs;

public record SummaryResponse(
    int    Count,
    double Average,
    double Median,
    double P25,
    double P75
);
