#!/usr/bin/env python3
"""
Button Generator Script
Generates button images from templates with text overlay.

Usage:
    python3 generate_buttons.py

This will read button_config.json and generate all defined buttons.
"""

from PIL import Image, ImageDraw, ImageFont
import json
import os

def generate_button(template_path, text, output_path, font_path, font_size=24, text_color=(255, 255, 255)):
    """
    Generate a button image with text overlay.

    Args:
        template_path: Path to template image
        text: Text to render on button
        output_path: Where to save the generated button
        font_path: Path to TTF/OTF font file
        font_size: Size of the font
        text_color: RGB tuple for text color
    """
    # Open template
    img = Image.open(template_path).convert('RGBA')

    # Create drawing context
    draw = ImageDraw.Draw(img)

    # Load font
    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        print(f"Warning: Could not load font {font_path}, using default. Error: {e}")
        font = ImageFont.load_default()

    # Calculate text position (center)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (img.width - text_width) // 2
    y = (img.height - text_height) // 2

    # Draw text
    draw.text((x, y), text, fill=text_color, font=font)

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"✓ Generated: {output_path}")

def main():
    config_path = "button_config.json"

    if not os.path.exists(config_path):
        print(f"Error: {config_path} not found!")
        print("Creating example configuration file...")

        example_config = {
            "default_font": "path/to/your/font.ttf",
            "default_font_size": 24,
            "default_text_color": [255, 255, 255],
            "templates_dir": "public/assets/ui/buttons/templates",
            "output_dir": "public/assets/ui/buttons",
            "buttons": [
                {
                    "template": "play_template.png",
                    "text": "PLAY",
                    "output": "play.png"
                },
                {
                    "template": "avatar_template.png",
                    "text": "AVATAR",
                    "output": "avatar.png"
                },
                {
                    "template": "leaderboard_template.png",
                    "text": "LEADERBOARD",
                    "output": "leaderboard.png",
                    "font_size": 20
                },
                {
                    "template": "store_template.png",
                    "text": "STORE",
                    "output": "store.png"
                }
            ]
        }

        with open(config_path, 'w') as f:
            json.dump(example_config, f, indent=2)

        print(f"Created {config_path}")
        print("Please edit the config file and set the correct font path, then run again.")
        return

    # Load configuration
    with open(config_path, 'r') as f:
        config = json.load(f)

    default_font = config.get("default_font", "")
    default_font_size = config.get("default_font_size", 24)
    default_text_color = tuple(config.get("default_text_color", [255, 255, 255]))
    templates_dir = config.get("templates_dir", "public/assets/ui/buttons/templates")
    output_dir = config.get("output_dir", "public/assets/ui/buttons")

    if not os.path.exists(default_font):
        print(f"Warning: Default font '{default_font}' not found. Will use system default.")

    # Generate all buttons
    print(f"\nGenerating buttons from {config_path}...\n")

    for button in config.get("buttons", []):
        template = button.get("template")
        text = button.get("text")
        output = button.get("output")
        font_path = button.get("font", default_font)
        font_size = button.get("font_size", default_font_size)
        text_color = tuple(button.get("text_color", default_text_color))

        template_path = os.path.join(templates_dir, template)
        output_path = os.path.join(output_dir, output)

        if not os.path.exists(template_path):
            print(f"✗ Template not found: {template_path}")
            continue

        generate_button(template_path, text, output_path, font_path, font_size, text_color)

    print("\n✓ Done! All buttons generated.\n")

if __name__ == "__main__":
    main()
