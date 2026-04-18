FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["SalaryService.Api/SalaryService.Api.csproj", "SalaryService.Api/"]
RUN dotnet restore "SalaryService.Api/SalaryService.Api.csproj"

COPY . .
WORKDIR "/src/SalaryService.Api"
RUN dotnet publish "SalaryService.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SalaryService.Api.dll"]