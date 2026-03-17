# Use official .NET runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["SalaryService.Api.csproj", "./"]
RUN dotnet restore "SalaryService.Api.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "SalaryService.Api.csproj" -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "SalaryService.Api.dll"]
