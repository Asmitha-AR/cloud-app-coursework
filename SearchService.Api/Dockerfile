FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["SearchService.Api/SearchService.Api.csproj", "SearchService.Api/"]
RUN dotnet restore "SearchService.Api/SearchService.Api.csproj"

COPY . .
WORKDIR "/src/SearchService.Api"
RUN dotnet publish "SearchService.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SearchService.Api.dll"]