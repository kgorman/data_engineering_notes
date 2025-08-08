#!/bin/bash

# Create new blog post with scaffolding

if [ $# -eq 0 ]; then
    echo "Usage: $0 <post-title>"
    echo "Example: $0 \"Getting Started with React Hooks\""
    exit 1
fi

TITLE="$1"
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
POST_DIR="posts/$DATE-$SLUG"

# Create post directory structure
mkdir -p "$POST_DIR"/{code,assets}

# Copy and customize templates
cp templates/post/template.md "$POST_DIR/index.md"
cp templates/post/metadata.json "$POST_DIR/metadata.json"

# Replace placeholders
sed -i.bak "s/Your Post Title/$TITLE/g" "$POST_DIR/index.md"
sed -i.bak "s/YYYY-MM-DD/$DATE/g" "$POST_DIR/index.md"
sed -i.bak "s/url-friendly-slug/$SLUG/g" "$POST_DIR/index.md"

# Clean up backup files
rm "$POST_DIR/index.md.bak"

echo "Created new post: $POST_DIR"
echo "Edit $POST_DIR/index.md to get started"
