using pokeCatch.Models;

namespace pokeCatch.Services;

public interface IPokemonService
{
    IEnumerable<Pokemon> GetAllPokemon();
    Pokemon GetPokemonById(int id);
    Pokemon CatchPokemon(string name, string type, string imageUrl);
    Pokemon UpdatePokemonName(int id, string newName);
    Pokemon ToggleFavorite(int id);
    void RemovePokemon(int id);
    IEnumerable<Pokemon> GetFavoritePokemon();
}