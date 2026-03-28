# ✅ Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy everything and restore
COPY . .
WORKDIR /src/SalaryService.Api
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# ✅ FIX: Runtime stage (was completely missing before)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copy published output from build stage
COPY --from=build /app/publish .

# ✅ FIX: Expose port 8080 to match Kubernetes containerPort
EXPOSE 8080

ENTRYPOINT ["dotnet", "SalaryService.Api.dll"]
