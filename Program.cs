using pokeCatch.Models;
using pokeCatch.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddSingleton<IPokemonService, PokemonService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure middleware
app.UseCors();
app.UseStaticFiles(); // This will serve files from wwwroot folder

var pokemonService = app.Services.GetRequiredService<IPokemonService>();

// API Endpoints

// Get all caught Pokémon
app.MapGet("/api/pokemon", () =>
{
    return Results.Ok(pokemonService.GetAllPokemon());
});

// Catch a new Pokémon
app.MapPost("/api/pokemon/catch", (CatchPokemonRequest request) =>
{
    try
    {
        var pokemon = pokemonService.CatchPokemon(request.Name, request.Type, request.ImageUrl);
        return Results.Ok(pokemon);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Update Pokémon name
app.MapPut("/api/pokemon/{id}/name", (int id, UpdateNameRequest request) =>
{
    try
    {
        var pokemon = pokemonService.UpdatePokemonName(id, request.NewName);
        return Results.Ok(pokemon);
    }
    catch (Exception ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// Toggle favorite status
app.MapPut("/api/pokemon/{id}/favorite", (int id) =>
{
    try
    {
        var pokemon = pokemonService.ToggleFavorite(id);
        return Results.Ok(pokemon);
    }
    catch (Exception ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// Remove Pokémon from Pokédex
app.MapDelete("/api/pokemon/{id}", (int id) =>
{
    try
    {
        pokemonService.RemovePokemon(id);
        return Results.Ok(new { message = "Pokémon removed successfully" });
    }
    catch (Exception ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// Get Pokémon by ID
app.MapGet("/api/pokemon/{id}", (int id) =>
{
    try
    {
        var pokemon = pokemonService.GetPokemonById(id);
        return Results.Ok(pokemon);
    }
    catch (Exception ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// Get favorite Pokémon
app.MapGet("/api/pokemon/favorites", () =>
{
    return Results.Ok(pokemonService.GetFavoritePokemon());
});

// Default route for serving the HTML page
app.MapGet("/", () => Results.Redirect("/index.html"));

app.Run();