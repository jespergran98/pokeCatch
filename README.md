# PokéCatch App

A simple web application for catching and collecting Pokémon in your personal Pokédex.

## Features

- Catch Pokémon and add them to your collection
- Rename your Pokémon with custom nicknames
- Mark Pokémon as favorites
- Remove Pokémon from your Pokédex
- View all caught Pokémon or filter by favorites

## Quick Start

1. Clone the repository
2. Run `dotnet run` in the project directory
3. Open your browser to `http://localhost:5177`

## File Structure

```
pokeCatch/
├── Program.cs                     # Main application entry point with API endpoints
├── Models/
│   └── Pokemon.cs                 # Pokemon data models and request classes
├── Services/
│   ├── IPokemonService.cs         # Interface for Pokemon operations
│   └── PokemonService.cs          # In-memory Pokemon storage and business logic
└── wwwroot/                       # Frontend files (to be created)
    ├── index.html                 # Main web page
    ├── style.css                  # Styling
    └── script.js                  # Frontend JavaScript logic
```

## Backend Files

### Program.cs
- Configures web server and API routes
- Enables CORS for frontend communication
- Serves static files from wwwroot folder
- Defines all REST API endpoints

### Models/Pokemon.cs
- `Pokemon` class with properties (ID, name, type, favorite status, etc.)
- `CatchPokemonRequest` for adding new Pokémon
- `UpdateNameRequest` for renaming operations

### Services/IPokemonService.cs
- Interface defining all Pokémon management operations

### Services/PokemonService.cs
- Implements Pokemon operations using in-memory storage
- Handles CRUD operations for the Pokédex

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pokemon` | Get all caught Pokémon |
| `POST` | `/api/pokemon/catch` | Catch a new Pokémon |
| `PUT` | `/api/pokemon/{id}/name` | Rename a Pokémon |
| `PUT` | `/api/pokemon/{id}/favorite` | Toggle favorite status |
| `DELETE` | `/api/pokemon/{id}` | Remove Pokémon from Pokédex |
| `GET` | `/api/pokemon/{id}` | Get specific Pokémon by ID |
| `GET` | `/api/pokemon/favorites` | Get only favorite Pokémon |

## Technology Stack

- **Backend**: ASP.NET Core 9.0 (Minimal APIs)
- **Frontend**: HTML, CSS, JavaScript (to be implemented)
- **Storage**: In-memory (data persists during server runtime)

## Next Steps

Create the frontend files in the `wwwroot` folder to complete the application.