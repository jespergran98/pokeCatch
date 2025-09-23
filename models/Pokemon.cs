namespace pokeCatch.Models;

public class Pokemon
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsFavorite { get; set; } = false;
    public DateTime CaughtAt { get; set; } = DateTime.UtcNow;
}

public class CatchPokemonRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
}

public class UpdateNameRequest
{
    public string NewName { get; set; } = string.Empty;
}