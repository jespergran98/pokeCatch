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


## Understanding the Backend Code Structure: A Beginner's Guide

If you're new to backend development with ASP.NET Core, here's a simple explanation of why the code is organized this way. Think of the app like a Pokémon gym: It needs rules for Pokémon (data), trainers to manage them (logic), and a front desk to handle visitors (web setup). We split files into folders to keep everything tidy and easy to maintain—like sorting your Poké Balls!

### Why Folders and Splitting Files?
- **Separation of Concerns**: Each part does one job well. This makes the code easier to read, fix bugs in, or add features to. For example, if you want to store Pokémon in a real database instead of memory, you only change one folder.
- **Scalability**: As your app grows (e.g., adding battles or trading), you can add more files without messing up the existing ones.
- **Best Practices**: This follows common C# patterns like "dependency injection" (letting parts "plug in" to each other) for flexible code.

### Key Folders and Files Explained
- **Models/ Folder**: This is where we define what a Pokémon "looks like" in code—like its name, type, and if it's a favorite. 
  - **Pokemon.cs**: Contains classes for Pokémon data and request formats (e.g., what info you send when catching one). It's just blueprints—no actions happen here. Location: In `Models/` because it's all about data shapes, separate from logic.

- **Services/ Folder**: This handles the "work" like catching, renaming, or listing Pokémon. It's the manager that stores and updates your Pokédex.
  - **IPokemonService.cs**: A "contract" listing what operations must be available (e.g., "CatchPokemon"). It's like a to-do list without the how-to.
  - **PokemonService.cs**: The actual code that does the work, using an in-memory list to store Pokémon. It implements the contract above. Location: In `Services/` to group business logic together, away from data or web stuff.

- **Root Folder**:
  - **Program.cs**: The main starter file. It sets up the web server, connects the services, and defines API endpoints (like URLs for getting Pokémon). It's the glue that makes everything run and respond to web requests. Location: In the root because it's the entry point—your app starts here!

In summary, Models are the "what" (data), Services are the "how" (logic), and Program.cs is the "where" (web handling). This setup keeps your code organized like a well-stocked Pokédex—ready for adventure!