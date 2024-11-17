# Deno Course

## Notes

### Running the Code

- You can run the code with `deno run --watch main.ts` to automatically re-run
  the code when you save the file.

### Importing Modules

- For TypeScript, you can use the `jsr` package to import JavaScript modules.

- You can also import from 'npm' packages by prefixing the import with `npm:`.

### Documentation

- Generate Docs with `deno doc --html --name="My Module" <file.ts>`. You can
  then serve the docs with:
  ```bash
  cd docs
  python3 -m http.server 8000
  ```

### Type Checking

- Use `deno run -check main.ts` or `deno check main.ts` to check the code for
  errors without running it.

- You can make Deno check a JS file by adding, you get the benefits without
  writing TypeScript `// @ts-check` to the top of the file.

### Linting

- You can use `deno lint` to check the code for linting errors.

### Formatting

- You can use `deno fmt --watch` to format the code.

### Deno Tasks

- You can create tasks much in the fashion of npm scripts with proper flags and
  permissions:

```json
{
  "scripts": {
    "lint": "next lint",
    "dev": "next dev"
  }
}
```

Would be

```json
{
  "tasks": {
    "lint": "deno lint --watch",
    "dev": "deno run --watch --allow-read main.ts"
  }
}
```

You can also run two tasks at once:

This runs lint and then format if it succeeds:

```json
{
  "tasks": {
    "lint-and-format": "deno lint && deno fmt"
  }
}
```

This runs lint and format independently:

```json
{
  "tasks": {
    "lint-and-format": "deno lint ; deno fmt"
  }
}
```

You can also make deno run a task from `package.json` if you have it by
prefixing the task with `npm:`

```json
{
  "tasks": {
    "seed": "deno run npm:seed"
  }
}
```

#### Separators

Example `deno.json`:

```json
{
  "tasks": {
    "dev": "deno run --watch --env main.ts", // Watch a task
    "build": "deno run npm:build", // Use an NPM script
    "all": "first ; second", // Run first and second, even if first task fails
    "sequential": "first && second", // Run only if first task succeeds
    "backup": "first || second", // Run only if first task fails
    "async": "first & second" // Run both concurrently
  }
}
```

You can pipe the output of one command to another:

- `>` is used to redirect the output of the previous command to a file. Example:
  `deno run --watch frontend/main.ts > frontend.log` will run the frontend
  server and redirect the output to `frontend.log`.

#### Built in commands for Deno Tasks

- deno task ships with several built-in commands that work the same out of the
  box on Windows, Mac, and Linux.
  @https://docs.deno.com/runtime/reference/cli/task_runner/#built-in-commands

- This is specially useful if your on Windows and deploying to Linux for
  example. And you don't need to install a third party tool like `rimraf`.

### Security

You can use the flags to give permissions to the code. For example:

- `--allow-read` to read from the file system.
- `--allow-write` to write to the file system.
- `--allow-net` to make network requests.

- A shorthand for dev that avoids this is `deno run -A main.ts` which allows all
  permissions.
- You can also restrict permissions with the `--no-allow-read`,
  `--no-allow-write`, and `--no-allow-net` flags.
- Or you can exclude files from the permissions with flags like
  `--deny-write='path/to/file.txt'` or `--deny-read='path/to/file.txt'`. This is
  useful if you have a file that you don't want to be read or written to and
  someone manages to inject code into your program/server.

### Environment Variables

- You can access environment variables with `Deno.env.get('NAME')`. This is a
  synchronous function so no need to use `await`.
- You can also set environment variables with `Deno.env.set('NAME', 'VALUE')`.
- You can create a `.env` file and it will be loaded but you MUST pass the
  `--env` flag to a Deno Task.

### Deno Benchmarking

- You can use `deno bench benchmark.ts` to benchmark the code.

For example:

```Typescript
const testString =
  "Hello, my email is test@example.com and another.email@domain.co.uk";
const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const preCompiledRegex = new RegExp(emailPattern);

Deno.bench({
  name: "Runtime regex",
  baseline: true,
  fn: () => {
    const regex = new RegExp(emailPattern);
    regex.test(testString);
  },
});

Deno.bench({
  name: "Precompiled exec",
  fn: () => {
    preCompiledRegex.exec(testString);
  },
});
```

Output:

```bash
Check file:///.../benchmark.ts
    CPU | AMD Ryzen 5 5600X 6-Core Processor
Runtime | Deno 2.0.6 (x86_64-unknown-linux-gnu)

file:///.../benchmark.ts

benchmark           time/iter (avg)        iter/s      (min … max)           p75      p99     p995
------------------- ----------------------------- --------------------- --------------------------
Runtime regex              248.6 ns     4,023,000 (220.7 ns … 506.2 ns) 239.9 ns 476.9 ns 489.8 ns
Precompiled exec            77.6 ns    12,880,000 ( 67.2 ns … 335.6 ns)  77.4 ns 169.9 ns 190.4 ns
```

### Testing

- You can use `deno test` to run all the tests found in your code.
- Import asserts from `@std/assert`.
- To write a test simply create a file with the `.test.ts` extension and write:

```Typescript
Deno.test(function MultiplyTest() {
  assertEquals(multiply(2, 3), 6);
  assertEquals(multiply(2, 0), 0);
});
```

You can also write them in a way that is compatible with Jest for example:

```Typescript
Deno.test("Multiply Test", () => {
  expect(multiply(2, 3)).toBe(6);
  expect(multiply(2, 0)).toBe(0);
});
```

You can also use async tests:

```Typescript
Deno.test("Database Lib", async (context) => {
  // Setup Logic
    const db = new Map()
  
  await context.step("db exists", () => {
    assertExists(db)
  })

    await context.step("db exists", () => {
    db.set("name", "Pablo"

        // Then you can run assertions
        assertGreater(db.size, 0);
        assertMatch(db.get("name"), /Pablo/);
        assertNotMatch(db.get("name"), /John/);
    });
});
```

##### Code Coverage

@https://docs.deno.com/runtime/reference/cli/coverage/

- You can use `deno coverage` to generate a coverage report.

### CLI

- You can use `jsr:@std/cli` to create a CLI.
- `parseArgs` allows you to parse arguments from the command line with Type
  Safety.
- `Prompt` allows you to ask a question to the user and get a response.
- `Confirm` allows you to ask a question to the user and get a boolean response.
- `colors` from `jsr:@std/fmt/colors` allows you to colorize the output of the
  CLI.
- `text` from `jsr:@std/text` allows you to transform text.

### Foreign Functions Interface (FFI)

- You can use `FFI` to call foreign functions written on another language. For
  example to run `C` Code or `Rust` Code.

- You can also compile it to a binary with the `cli:compile` task. Try it after
  its compiled with:

```bash
./cli/FFI/compiled/upper.exe --text "deno is cool" --kebab
```
