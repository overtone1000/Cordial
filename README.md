# Intellispace-_Plugin
Custom Intellispace Plugin

## Dependencies
- Typescript compiler
- Tauri
    - SvelteKit
    - Rust
- Nix Environment Selector is required to work on Nix

## Components

### Shim
`./shim` contains a shim plugin for Intellispace. `./shim/src` contains the source, which is build by the typescript compiler and output to `./shim/prod`

### Tauri Application
`./application` contains a Tauri app that interacts with the shim by hosting a rust-based web server and running a SvelteKit UI via Tauri.