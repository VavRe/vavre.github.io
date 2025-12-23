# Vahid Rahimzadeh - Personal Website

A modern personal website built with Nuxt 3 and Nuxt Content, featuring:

- 📝 File-based CMS blog using Markdown
- 🎨 Consistent design with Tailwind CSS
- 🚀 Static site generation for optimal performance
- 📱 Fully responsive design
- ⚡ Fast and SEO-friendly

## 🛠️ Tech Stack

- **Framework**: [Nuxt 3](https://nuxt.com/)
- **CMS**: [Nuxt Content](https://content.nuxt.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Font Awesome](https://fontawesome.com/)
- **Hosting**: GitHub Pages

## 📦 Setup

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Generate static site
npm run generate

# Preview production build
npm run preview
```

## 📝 Adding Blog Posts

Create a new markdown file in `/content/blog/`:

```markdown
---
title: "Your Post Title"
description: "A brief description"
date: 2024-12-23
tags: ["tag1", "tag2"]
readingTime: "5 min read"
---

# Your Post Title

Your content here...
```

## 🚀 Deployment

The site automatically deploys to GitHub Pages when you push to the `dev` branch:

1. Make changes on the `dev` branch
2. Push to GitHub
3. GitHub Actions builds and deploys to `main` branch
4. Site is live on GitHub Pages

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD workflow
├── assets/
│   └── css/
│       └── main.css        # Global styles
├── components/             # Vue components
├── content/
│   └── blog/              # Blog posts (Markdown)
├── pages/                 # Nuxt pages
├── public/                # Static assets
├── nuxt.config.ts         # Nuxt configuration
└── tailwind.config.js     # Tailwind configuration
```

## 📄 License

Personal website - All rights reserved
