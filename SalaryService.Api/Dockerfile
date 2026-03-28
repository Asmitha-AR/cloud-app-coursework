# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
WORKDIR /src/SalaryService.Api
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Runtime stage  ← THIS WAS MISSING
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SalaryService.Api.dll"]
