import os, glob, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_roan_app_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # 1. Obsidian Matte Black Squircle with subtle luxury gradient
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    radius = int(size * 0.23)
    
    for y in range(size):
        ratio = y / size
        r = int(22 - ratio * 14)
        g = int(21 - ratio * 14)
        b = int(28 - ratio * 18)
        bg_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=255)
    
    img = Image.composite(bg, img, mask)
    draw = ImageDraw.Draw(img)
    
    # 2. Subtle White Light Glow
    glow_canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_canvas)
    
    center_x = int(size * 0.75)
    center_y = int(size * 0.22)
    max_r = int(size * 0.45)
    for i in range(max_r, 0, -4):
        alpha = int(45 * (1 - i / max_r) ** 1.8)
        glow_draw.ellipse(
            [(center_x - i, center_y - i), (center_x + i, center_y + i)],
            fill=(255, 255, 255, alpha)
        )
        
    img = Image.alpha_composite(img, glow_canvas)
    draw = ImageDraw.Draw(img)
    
    # 3. Sleek border
    border_w = max(2, int(size * 0.022))
    draw.rounded_rectangle(
        [(border_w // 2, border_w // 2), (size - 1 - border_w // 2, size - 1 - border_w // 2)],
        radius=radius - 1,
        outline=(255, 255, 255, 60),
        width=border_w
    )
    
    # 4. Premium ROAN Typography
    font_size = int(size * 0.24)
    font = None
    font_names = ["timesbd.ttf", "georgiab.ttf", "timesbi.ttf", "georgiaz.ttf", "arialbd.ttf"]
    for fn in font_names:
        try:
            font = ImageFont.truetype(fn, font_size)
            break
        except Exception:
            continue
    if not font:
        font = ImageFont.load_default()
        
    text = "ROAN"
    letters = ["R", "O", "A", "N"]
    letter_widths = []
    for l in letters:
        bbox = draw.textbbox((0, 0), l, font=font)
        letter_widths.append((bbox[2] - bbox[0], bbox[3] - bbox[1], bbox))
        
    spacing = int(size * 0.04)
    total_w = sum(w for w, h, b in letter_widths) + spacing * (len(letters) - 1)
    start_x = (size - total_w) // 2
    base_y = int(size * 0.44)
    
    # Glow text
    text_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_t_draw = ImageDraw.Draw(text_glow)
    
    curr_x = start_x
    for i, l in enumerate(letters):
        w, h, bbox = letter_widths[i]
        glow_t_draw.text((curr_x - bbox[0], base_y - bbox[1]), l, font=font, fill=(255, 255, 255, 200))
        curr_x += w + spacing
        
    text_glow = text_glow.filter(ImageFilter.GaussianBlur(radius=max(2, int(size * 0.025))))
    img = Image.alpha_composite(img, text_glow)
    draw = ImageDraw.Draw(img)
    
    # Draw letters
    curr_x = start_x
    for i, l in enumerate(letters):
        w, h, bbox = letter_widths[i]
        y_pos = base_y - bbox[1]
        x_pos = curr_x - bbox[0]
        
        draw.text((x_pos, y_pos + max(1, int(size*0.015))), l, font=font, fill=(0, 0, 0, 200))
        draw.text((x_pos, y_pos), l, font=font, fill=(255, 255, 255, 255))
        
        if l == "R":
            star_cx = x_pos + int(w * 0.22)
            star_cy = y_pos + int(h * 0.08)
            star_r = max(2, int(size * 0.012))
            draw.polygon([
                (star_cx, star_cy - star_r),
                (star_cx + int(star_r*0.4), star_cy),
                (star_cx, star_cy + star_r),
                (star_cx - int(star_r*0.4), star_cy)
            ], fill=(255, 255, 255, 255))
            
        elif l == "A":
            star_cx = x_pos + int(w * 0.5)
            star_cy = y_pos + int(h * 0.58)
            star_r = max(2, int(size * 0.012))
            draw.polygon([
                (star_cx, star_cy - star_r),
                (star_cx + int(star_r*0.4), star_cy),
                (star_cx, star_cy + star_r),
                (star_cx - int(star_r*0.4), star_cy)
            ], fill=(255, 255, 255, 255))
            
        curr_x += w + spacing

    # 5. Subtitle
    sub_font_size = int(size * 0.065)
    try:
        sub_font = ImageFont.truetype("arialbd.ttf", sub_font_size)
    except:
        sub_font = ImageFont.load_default()
        
    sub_text = "ÁNGEL  &  ROXANA"
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (size - sub_w) // 2 - sub_bbox[0]
    sub_y = int(size * 0.72)
    
    draw.text((sub_x, sub_y), sub_text, font=sub_font, fill=(200, 205, 215, 210))
    line_w = int(size * 0.18)
    line_y = int(size * 0.83)
    draw.line([(size // 2 - line_w // 2, line_y), (size // 2 + line_w // 2, line_y)], fill=(255, 255, 255, 120), width=max(1, int(size*0.005)))
    
    return img

def create_roan_badge(size=96):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.58)
    try:
        font = ImageFont.truetype("timesbd.ttf", font_size)
    except:
        font = ImageFont.load_default()
        
    text = "R"
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1]
    
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    return img

def main():
    icon_512 = create_roan_app_icon(512)
    icon_192 = create_roan_app_icon(192)
    badge_96 = create_roan_badge(96)
    
    dirs = [
        "C:/Users/angel/.gemini/antigravity-ide/scratch/aura-chat",
        "C:/Users/angel/.gemini/antigravity-ide/scratch/aura-chat/www",
        "C:/Users/angel/.gemini/antigravity-ide/scratch/aura-app",
        "C:/Users/angel/.gemini/antigravity-ide/scratch/aura-app/www"
    ]
    
    for d in dirs:
        if os.path.exists(d):
            icon_512.save(os.path.join(d, "icon-512.png"), "PNG")
            icon_192.save(os.path.join(d, "icon-192.png"), "PNG")
            badge_96.save(os.path.join(d, "badge-96.png"), "PNG")
            print(f"Saved ROAN icons to {d}")
            
    # Android Mipmaps
    mipmap_targets = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    
    android_res_dirs = [
        "C:/Users/angel/.gemini/antigravity-ide/scratch/aura-chat/android/app/src/main/res",
        "C:/Users/angel/.gemini/antigravity-ide/scratch/aura-app/android/app/src/main/res"
    ]
    
    for base_res in android_res_dirs:
        if os.path.exists(base_res):
            for folder, sz in mipmap_targets.items():
                dest_dir = os.path.join(base_res, folder)
                if os.path.exists(dest_dir):
                    mip_icon = create_roan_app_icon(sz)
                    mip_icon.save(os.path.join(dest_dir, 'ic_launcher.png'), 'PNG')
                    mip_icon.save(os.path.join(dest_dir, 'ic_launcher_round.png'), 'PNG')
                    mip_icon.save(os.path.join(dest_dir, 'ic_launcher_foreground.png'), 'PNG')
                    print(f"Updated Android {folder} ({sz}x{sz}) in {base_res}")
                    
    print("All ROAN official luxury icons deployed successfully!")

if __name__ == "__main__":
    main()
