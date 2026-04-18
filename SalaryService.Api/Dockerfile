# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SalaryService.Api.csproj", "./"]
RUN dotnet restore "SalaryService.Api.csproj"
COPY . .
RUN dotnet publish "SalaryService.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SalaryService.Api.dll"]
