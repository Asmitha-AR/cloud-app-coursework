# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy everything
COPY . .

# Move into service folder
WORKDIR /src/SalaryService.Api

# Restore & publish
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish
