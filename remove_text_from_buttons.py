#!/usr/bin/env python3
"""
Script to remove text from button images and create template versions.
This detects white text pixels and replaces them with the surrounding background color.
"""

from PIL import Image
import os

def remove_text_from_button(input_path, output_path):
    """
    Remove white text from button image by replacing with background color.
    """
    img = Image.open(input_path)
    img = img.convert('RGBA')
    pixels = img.load()
    width, height = img.size

    # Detect the main background color (sample from center, away from text)
    # Sample from multiple points to get a good average
    sample_points = [
        (10, height // 2),  # Left side
        (width - 10, height // 2),  # Right side
        (width // 2, 10),  # Top
        (width // 2, height - 10),  # Bottom
        (15, height // 2),  # More left samples
        (20, height // 2),
        (width - 15, height // 2),  # More right samples
        (width - 20, height // 2),
    ]

    bg_colors = []
    for x, y in sample_points:
        if 0 <= x < width and 0 <= y < height:
            pixel = pixels[x, y]
            # Only use non-white, non-border pixels (dark borders are also excluded)
            if 50 < pixel[0] < 220 and 50 < pixel[1] < 220 and 50 < pixel[2] < 220:
                bg_colors.append(pixel)

    if not bg_colors:
        # Fallback: scan the entire middle row for the most common non-border color
        color_counts = {}
        y = height // 2
        for x in range(width):
            pixel = pixels[x, y]
            if 50 < pixel[0] < 220 and 50 < pixel[1] < 220 and 50 < pixel[2] < 220:
                color_counts[pixel] = color_counts.get(pixel, 0) + 1

        if color_counts:
            bg_color = max(color_counts, key=color_counts.get)
            print(f"Detected background color (fallback) for {os.path.basename(input_path)}: {bg_color}")
        else:
            print(f"Warning: Could not detect background color for {input_path}")
            return
    else:
        # Use the most common background color
        bg_color = bg_colors[0]
    print(f"Detected background color for {os.path.basename(input_path)}: {bg_color}")

    # Replace white/light pixels (text) with background color
    for y in range(height):
        for x in range(width):
            pixel = pixels[x, y]
            r, g, b, a = pixel

            # Detect white/light colored text (threshold)
            # White text typically has high RGB values and is not part of the border
            if r > 200 and g > 200 and b > 200 and a > 200:
                pixels[x, y] = bg_color

    img.save(output_path)
    print(f"Created template: {output_path}")

def main():
    buttons_dir = "public/assets/ui/buttons"
    templates_dir = "public/assets/ui/buttons/templates"

    button_files = ['play.png', 'avatar.png', 'leaderboard.png', 'store.png']

    for button_file in button_files:
        input_path = os.path.join(buttons_dir, button_file)
        output_path = os.path.join(templates_dir, button_file.replace('.png', '_template.png'))

        if os.path.exists(input_path):
            remove_text_from_button(input_path, output_path)
        else:
            print(f"Warning: {input_path} not found")

    print("\n✓ Done! Template buttons created in public/assets/ui/buttons/templates/")

if __name__ == "__main__":
    main()
