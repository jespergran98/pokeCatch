using pokeCatch.Models;

namespace pokeCatch.Services;

public class PokemonService : IPokemonService
{
    private readonly List<Pokemon> _pokedex;
    private int _nextId;

    public PokemonService()
    {
        _pokedex = new List<Pokemon>();
        _nextId = 1;
    }

    public IEnumerable<Pokemon> GetAllPokemon()
    {
        return _pokedex.OrderByDescending(p => p.CaughtAt);
    }

    public Pokemon GetPokemonById(int id)
    {
        var pokemon = _pokedex.FirstOrDefault(p => p.Id == id);
        if (pokemon == null)
        {
            throw new ArgumentException($"Pokémon with ID {id} not found");
        }
        return pokemon;
    }

    public Pokemon CatchPokemon(string name, string type, string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Pokémon name cannot be empty");
        }

        if (string.IsNullOrWhiteSpace(type))
        {
            throw new ArgumentException("Pokémon type cannot be empty");
        }

        var pokemon = new Pokemon
        {
            Id = _nextId++,
            Name = name.Trim(),
            OriginalName = name.Trim(),
            Type = type.Trim(),
            ImageUrl = imageUrl?.Trim() ?? string.Empty,
            IsFavorite = false,
            CaughtAt = DateTime.UtcNow
        };

        _pokedex.Add(pokemon);
        return pokemon;
    }

    public Pokemon UpdatePokemonName(int id, string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
        {
            throw new ArgumentException("New name cannot be empty");
        }

        var pokemon = GetPokemonById(id);
        pokemon.Name = newName.Trim();
        return pokemon;
    }

    public Pokemon ToggleFavorite(int id)
    {
        var pokemon = GetPokemonById(id);
        pokemon.IsFavorite = !pokemon.IsFavorite;
        return pokemon;
    }

    public void RemovePokemon(int id)
    {
        var pokemon = GetPokemonById(id);
        _pokedex.Remove(pokemon);
    }

    public IEnumerable<Pokemon> GetFavoritePokemon()
    {
        return _pokedex.Where(p => p.IsFavorite).OrderByDescending(p => p.CaughtAt);
    }
}