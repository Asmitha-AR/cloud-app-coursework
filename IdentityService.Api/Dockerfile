FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["IdentityService.Api/IdentityService.Api.csproj", "IdentityService.Api/"]
RUN dotnet restore "IdentityService.Api/IdentityService.Api.csproj"

COPY . .
WORKDIR "/src/IdentityService.Api"
RUN dotnet publish "IdentityService.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "IdentityService.Api.dll"]