# Auction House Semester Project

This project is a fully responsive Auction House web application built as my semester project at Noroff. The goal was to plan, design, and develope a complete front-end application using HTML, CSS (Sass), JavaScript, and the Noroff Auction House API. The app allows users to register, log in, browse listings, create and manage their own listings, and place bids on items. It focuses on clean UI design, modular code structure, and an intuitive user experience across all devices.

# Features

- User registration & login

- Profile management (bio, avatar, banner)

- Create, edit, delete listings

- Bid on listings and view bid history

- Display highest bid and total number of bids

- Dynamic navigation that responds to user authentication

- Responsive layout and mobile-friendly bidding flow

- Organized and modular JavaScript codebase

# Teck Stack

- HTML

- CSS / Sass (SCSS)

- Bootstrap 5.3.8

- JavaScript (ES Modules)

- Noroff Auction House API v2

- Node Package Manager (NPM) – Sass compilation

- Static hosting (GitHub Pages)

# Installation Guide

## Clone the project

```bash
git clone <>
cd aution-house-semester-project
```

## Initialize package.json

If you don’t already have a package.json file, create one by running:

```bash
npm init -y
```

This create a basic package.json in your project folder.

## Install Sass

Sass is used to compile the .scss files into a single CSS file.
Install Sass as a dev dependency:

```bash
npm install sass --save-dev
```

This will add Sass under "devDependencies" in your package.json.

Then add these scripts to package.json (inside the "scripts" object):

```bash
"scripts": {
  "watch": "sass --watch --load-path=node_modules styles/scss/main.scss styles/css/main.css",
  "build": "sass --style=compressed --no-source-map --load-path=node_modules styles/scss/main.scss styles/css/main.css"}

```

Now you can:

- Watch and auto-compile SCSS while developing:

```bash
npm run watch
```

- Build a minified css file for production:

```bash
npm run build
```

## Install Bootstrap

Bootstrap is used for layout, grid, and some base styling.

Install Bootstrap as a normal dependency:

```bash
npm install bootstrap
```

This adds Bootstrap under "dependencies" in your package.json.

To use Bootstrap’s styles in your Sass, import it at the top of your main SCSS file (for example in styles/scss/main.scss):

```bash
@import "bootstrap/scss/bootstrap";

```

# Author

Sidra Shahid

# Live Link
