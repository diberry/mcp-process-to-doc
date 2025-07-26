# Instructions for TypeScript Code Generation for MCP Engineering to Documentation process

## Monorepo

- This is a typescript npm monorepo. All new packages should go into `./packages/` with a unique name. 

## System documentation
- System documentation should be read and updated in Markdown format in the `./docs` directory.

## File creation and modification guidelines
- All code should be written in TypeScript, or bash shell scripts.
- All work on the same functionality must be done within the same file. 
    - Don't create new files for the same functionality. 
    - When created a file or folder, ask for confirmation including where it is created and its purpose. 
- If you need to create a new file, ensure it is for a different functionality or module

## JavaScript to TypeScript conversion
- All requires and imports should be at the top of the file.
- Convert all `var` and `let` declarations to `const` where possible.
- Use `import` statements instead of `require`.
- Ensure all functions are typed correctly for incoming parameters, loop variables, and return types
- Prefer native or dependency types over custom types. Extend existing types if necessary.
- Create custom types at the top of the file, after imports and only when necessary.
- If a type stays within a single file's methods and functions, define it at the top of that file.
- Use `interface` for defining object shapes and `type` for union types or more complex types.
- Use `async/await` for asynchronous operations.

## Hard-coded strings
- If a string is a constant for the system such as a directory name or file name, it must be stored in a config (such as `./src/config.ts`) file then used from that location.
- The config file should use ESM __dir to set the full path so that the path is retrieved from the config file with full pathing. 