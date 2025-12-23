# Important: Node.js Version Requirement

This project requires **Node.js version 20** or **22** (LTS versions).

Your current Node version (21.6.1) is not compatible. Please switch to a compatible version:

## Using NVM (Node Version Manager):

```bash
# Install Node 20 (LTS)
nvm install 20

# Use Node 20
nvm use 20

# Or use the .nvmrc file
nvm use
```

## Or download directly:
- Node.js 20 LTS: https://nodejs.org/

After switching to Node 20, run:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Start development server
npm run dev
```

## Then proceed with:

1. **Development**: `npm run dev` - Starts local server at http://localhost:3000
2. **Build**: `npm run build` - Builds the application
3. **Generate**: `npm run generate` - Generates static site for GitHub Pages
4. **Preview**: `npm run preview` - Preview the generated static site

---

*Note: The GitHub Actions workflow is configured to use Node 20 automatically for deployments.*
