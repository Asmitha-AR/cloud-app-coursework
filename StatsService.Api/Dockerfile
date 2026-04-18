FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["StatsService.Api/StatsService.Api.csproj", "StatsService.Api/"]
RUN dotnet restore "StatsService.Api/StatsService.Api.csproj"

COPY . .
WORKDIR "/src/StatsService.Api"
RUN dotnet publish "StatsService.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "StatsService.Api.dll"]