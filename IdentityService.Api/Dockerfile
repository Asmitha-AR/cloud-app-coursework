# Use official .NET runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["IdentityService.Api.csproj", "./"]
RUN dotnet restore "IdentityService.Api.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "IdentityService.Api.csproj" -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "IdentityService.Api.dll"]
